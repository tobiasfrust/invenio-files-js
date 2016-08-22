/*
 * This file is part of Invenio.
 * Copyright (C) 2016 CERN.
 *
 * Invenio is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * Invenio is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Invenio; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.
 *
 * In applying this license, CERN does not
 * waive the privileges and immunities granted to it by virtue of its status
 * as an Intergovernmental Organization or submit itself to any jurisdiction.
 */

/**
  * @ngdoc factory
  * @name InvenioFilesUploaderModel
  * @namespace InvenioFilesUploaderModel
  * @param {service} $http - Angular http requests service.
  * @param {service} $q - Angular promise services.
  * @param {service} InvenioFilesAPI - The files api service.
  * @description
  *     Create a model to handle the uploads
  */
function InvenioFilesUploaderModel($rootScope, $q, InvenioFilesAPI) {

  function Uploader(args) {
    this.args = angular.copy(args || {});
    // The file queue
    this.queue = [];
    // The upload instance queue
    this.uploads = [];
    // The files on pending queue
    this.pending = [];
    // The uploader state
    this.state = {
      STARTED: 1,
      STOPPED: 2,
    };
    this.currentState = this.state.STOPPED;
  }

  Uploader.prototype.setArgs= function(args) {
    this.args = angular.copy(args || {});
  };

  Uploader.prototype.pushToQueue = function(file) {
    this.queue.push(file);
  };

  Uploader.prototype.removeFromQueue = function() {
    return this.queue.shift();
  };

  Uploader.prototype.removeFromQueueIndex = function(file) {
    this.queue.splice(_.indexOf(this.queue, file), 1);
    $rootScope.$emit('invenio.uploader.upload.file.removed');
  };

  Uploader.prototype.addUpload = function(upload) {
    this.uploads.push(upload);
  };

  Uploader.prototype.removeUpload = function(upload) {
    this.uploads.splice(_.indexOf(this.uploads, upload), 1);
  };

  Uploader.prototype.getUploads = function() {
    return this.uploads;
  };

  Uploader.prototype.cancelUploads = function() {
    // Change the state
    this.setState(this.state.STOPPED);
    // Make a copy of uploads
    var uploads = angular.copy(this.uploads);
    // Flush everything
    this.flush();
    // Javascript make me happy, not!
    _.each(uploads, function(upload, index) {
      if (upload) {
        upload.abort();
      }
      if (uploads.length === index + 1) {
        _.delay(function() {
          $rootScope.$emit('invenio.uploader.upload.canceled');
        });
      }
    });
  };

  Uploader.prototype.setState = function(state) {
    this.currentState = state;
    $rootScope.$emit('invenio.uploader.state.changed', state);
  };

  Uploader.prototype.getState = function() {
    return this.currentState;
  };

  Uploader.prototype.getStates = function() {
    return this.state;
  };

  Uploader.prototype.pushToPending = function(file) {
    this.pending.push(file);
  };

  Uploader.prototype.removeFromPending = function() {
    return this.pending.shift();
  };

  Uploader.prototype.next = function() {
    if (this.getState() === this.state.STARTED) {
      var uploadNext;
      if(this.pending.length) {
        uploadNext = this.removeFromPending();
      }
      if (!uploadNext) {
        uploadNext = this.removeFromQueue();
      }

      if (uploadNext) {
        this.upload(uploadNext);
        $rootScope.$emit('invenio.uploader.next.requested', uploadNext);
      } else if (!this.uploads.length) {
        // Clear the queues
        this.flush();
        $rootScope.$emit('invenio.uploader.upload.completed');
        this.setState(this.state.STOPPED);
      }
    }
  };

  Uploader.prototype.checkUploadStatus = function(upload) {
    var defer = $q.defer();
    if (upload.xhr !== undefined) {
      defer.resolve(upload);
    } else {
      upload.then(function(ret) {
        defer.resolve(ret);
      });
    }
    return defer.promise;
  };

  Uploader.prototype.upload = function(file) {
    // Do the upload and call this.next() else this.push()
    var that = this;
    // Check if we have more space in the slots
    if (that.getUploads().length < (that.args.max_request_slots || 3)) {
      that._upload(file)
        .then(function(_obj) {
          var upload = InvenioFilesAPI
            .upload(_obj.uploadArgs);
          // Emit
          $rootScope.$emit('invenio.uploader.upload.file.init', file);
          // Add the upload to the list
          that.addUpload(upload);
          upload.then(
              function(response) {
                var params = (response.data.links === undefined) ? _obj.uploadArgs.url : response;
                _obj.successCallback
                  .call(this, params, file)
                  .then(
                    function(response) {
                      $rootScope.$emit(
                        'invenio.uploader.upload.file.uploaded',
                        response
                      );
                    }, function(response) {
                      $rootScope.$emit(
                        'invenio.uploader.upload.file.errored', response
                        );
                    });
                // Call success funtion with url
              }, function(response) {
                $rootScope.$emit(
                  'invenio.uploader.upload.file.errored', response
                );
              }, function(evt) {
                var progress = parseInt(100.0 * evt.loaded / evt.total, 10);
                var params = {
                  file: evt.config.data.file,
                  progress: progress > 100 ? 100 : progress
                };
                $rootScope.$emit(
                  'invenio.uploader.upload.file.progress', params
                );
              }
            )
            .finally(function(evt) {
                // Remove the uploader from the list
                that.removeUpload(this);
                // Call the next upload
                _.delay(function() {
                  that.next();
                });
                $rootScope.$emit('invenio.uploader.upload.next.call');
              });
        });
    } else {
      // Just put it in the pending
      that.pushToPending(file);
      // File pending
      $rootScope.$emit('invenio.uploader.upload.file.pending', file);
    }
  };

  Uploader.prototype._upload = function (file) {
    var deferred = $q.defer();
    var that = this;
    if (this.args.resumeChunkSize === undefined || file.size < this.args.resumeChunkSize) {
      $rootScope.$emit(
        'invenio.uploader.upload.file.chunked.requested', file
      );
      // Prepare args
      var args = that._prepareRequest(file.name, 'PUT');
      // Add the file
      args.data.file = file;
      // Resolve the request
      deferred.resolve({
        uploadArgs: args,
        successCallback: that.postNormalUploadProcess
      });
    } else {
      $rootScope.$emit(
        'invenio.uploader.upload.file.normal.requested', file
      );
      var _args = that._prepareRequest(file.name, 'POST');
      // Add the file
      _args.data.file = file;
      // Request upload id
      that._requestUploadID(_args)
        .then(function(response) {
          var _requestArgs = that._prepareRequest(file.name, 'PUT');
          // Append the file
          _requestArgs.data.file = file;
          // Append the url
          _requestArgs.url = response.data.links.self;
          // Resolve the request
          deferred.resolve({
            uploadArgs: _requestArgs,
            successCallback: that.postChunkUploadProcess
          });
        });
    }
    return deferred.promise;
  };

  Uploader.prototype.postChunkUploadProcess = function(url, file) {
    var deferred = $q.defer();
    // Add processing state to the file
    $rootScope.$emit('invenio.uploader.upload.file.processing', {file: file});
    // Finishing up the chunk upload
    InvenioFilesAPI.request({
      method: 'POST',
      url: url,
    }).then(function(response) {
      deferred.resolve(response);
    }, function(error) {
      deferred.reject(error);
    });
    return deferred.promise;
  };

  Uploader.prototype.postNormalUploadProcess = function(obj, file) {
    var deferred = $q.defer();
    deferred.resolve(obj);
    return deferred.promise;
  };

  Uploader.prototype._requestUploadID = function(args) {
    args.url = args.url+'?uploads&size='+ args.data.file.size + '&partSize='+ args.resumeChunkSize;
    return InvenioFilesAPI.request(args);
  };

  Uploader.prototype._prepareRequest = function(name, method) {
    var args = angular.copy(this.args);
    args.url = args.url + '/' + name;
    args.method = method || 'POST';
    return args;
  };

  // _helpers flush all
  Uploader.prototype.flush = function() {
    this.pending = [];
    this.uploads = [];
    this.queue = [];
  };

  ////////////

  return Uploader;
}

InvenioFilesUploaderModel.$inject = [
  '$rootScope',
  '$q',
  'InvenioFilesAPI'
];

angular.module('invenioFiles.factories')
  .factory('InvenioFilesUploaderModel', InvenioFilesUploaderModel);