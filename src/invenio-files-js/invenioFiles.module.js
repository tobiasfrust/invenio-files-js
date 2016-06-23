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
(function (angular) {
  // Controllers

  /**
   * @ngdoc controller
   * @name invenioFilesController
   * @namespace invenioFilesController
   * @description
   *    Invenio files controller.
   */
  function invenioFilesController($rootScope, $scope, $q, $timeout,
    invenioFilesAPI, InvenioFilesUploaderModel) {

    // Assign the controller to vm
    var vm = this;

    // Parameters

    // Initialize the endpoints
    vm.invenioFilesEndpoints = {};

    // Initialize module $http request args
    vm.invenioFilesArgs = {
      data: {
        file: [],
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Initialize the model
    var Uploader = new InvenioFilesUploaderModel();

    /**
     * Request an upload
     * @memberof invenioFilesController
     * @function upload
     */
    function getEndpoints(){
      var deferred = $q.defer();
      if (vm.invenioFilesEndpoints.bucket === undefined) {
        // If the action url doesnt exists request it
        invenioFilesAPI.request({
          method: 'POST',
          url: vm.invenioFilesEndpoints.initialization,
          data: {},
          headers: vm.invenioFilesArgs.headers || {}
        }).then(function success(response) {
          // Get the bucket
          vm.invenioFilesArgs.url = response.data.links.bucket;
          // Upadate the endpoints
          $rootScope.$broadcast(
            'invenio.records.endpoints.updated', response.data.links
          );
          deferred.resolve({});
        }, function error(response) {
          // Error
          deferred.reject(response);
        });
      } else {
        // We already have it resolve it asap
        vm.invenioFilesArgs.url = vm.invenioFilesEndpoints.bucket;
        deferred.resolve({});
      }
      return deferred.promise;
    }

    /**
     * Request an upload
     * @memberof invenioFilesController
     * @function upload
     */
    function upload() {
      getEndpoints().then(function() {
        // Get next file to upload
        Uploader.setArgs(vm.invenioFilesArgs);
        // Get the available states
        var states = Uploader.getStates();
        // Change the state
        Uploader.setState(states.STARTED);
        // Start uploading
        Uploader.next();
        // Emit the news!
        $rootScope.$emit('invenio.uploader.upload.started');
      }, function(response) {
        // Broadcast the error
        $scope.$broadcast('invenio.uploader.error', response);
      });
    }

    /**
     * Initialize the uploader
     * @memberof invenioFilesController
     * @function invenioUploaderInitialization
     */
    function invenioUploaderInitialization(evt, params, endpoints, files) {
      // Do initialization
      vm.invenioFilesArgs = angular.merge(
        {},
        vm.invenioFilesArgs,
        params
      );
      // Add the entpoints
      vm.invenioFilesEndpoints = angular.merge(
        {},
        vm.invenioFilesEndpoints,
        endpoints
      );

      // Add any files on initialization
      vm.files = files;
    }

    /**
      * Updating the endpoints
      * @memberof invenioFilesController
      * @function invenioRecordsEndpointsUpdated
      * @param {Object} evt - The event object.
      * @param {Object} endpoints - The object with the endpoints.
      */
    function invenioFilesEndpointsUpdated(evt, endpoints) {
      vm.invenioFilesEndpoints = angular.merge(
        {},
        vm.invenioFilesEndpoints,
        endpoints
      );
    }

    /**
     * Get files that are already uploaded
     * @memberof invenioFilesController
     * @function getCompleted
     */
    function getCompleted() {
      return _.reject(vm.files, function(file) {
        return file.completed === undefined;
      });
    }

    /**
     * Remove the file from the list and from server if is uploaded
     * @memberof invenioFilesController
     * @function removeFile
     */
    function removeFile(file) {
      if (file.completed !== undefined) {
        // Prepare parameters
        var args = angular.copy(vm.invenioFilesArgs);
        args.method = 'DELETE';
        args.url = file.links.self;
        invenioFilesAPI.request(args).then(function(response) {
          // Just remove it from the list
          vm.files.splice(_.indexOf(vm.files, file), 1);
          Uploader.removeFromQueueIndex(file);
          // Broadcast the sad news
          $scope.$broadcast('invenio.uploader.file.deleted', file);
        }, function(response) {
          $scope.$broadcast('invenio.uploader.error', response);
        });
      } else {
        // Just remove it from the list
        vm.files.splice(_.indexOf(vm.files, file), 1);
        Uploader.removeFromQueueIndex(file);
        // Broadcast the sad news
        $scope.$broadcast('invenio.uploader.file.deleted', file);
      }
    }

    function fileReducer(file) {
      return {
        key: file.name,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate
      };
    }

    /**
     * Add files to the list
     * @memberof invenioFilesController
     * @function addFiles
     */
    function addFiles(files) {
      _.each(files, function(file, index) {
        if (_.findWhere(vm.files, {name: file.name}) === undefined) {
          var _file = fileReducer(file);
          vm.files.push(_file);
          // Added to queue
          Uploader.pushToQueue(file);
        } else {
          $scope.$broadcast('invenio.uploader.warning', {
            data: {
              message: 'Duplicate file '+ file.name,
            }
          });
        }
      });
    }

    /**
     * Cancel all active uploads
     * @memberof invenioFilesController
     * @function invenioFilesUploadCancel
     */
    function invenioFilesUploadCancel() {
      Uploader.cancelUploads();
    }

    function findInFiles(key) {
      var index = -1;
      angular.forEach(vm.files, function(value, _index) {
        if (value.key === key) {
          index = _index;
          return;
        }
      });
      return index;
    }

    /**
     * When the files has been uploaded succesfully
     * @memberof invenioFilesController
     * @function fileUplaodedSuccess
     */
    function fileUploadedSuccess(evnt, data) {
      // note that if the file uploaded via chunks the success receives
      // two keys the ``response`` and ``data`` in any other case it just
      // receives the object
      var _obj = data.data;

      // Find the index
      var index = findInFiles(_obj.key);
      if (index > -1) {
        vm.files[index].completed = true;
        vm.files[index] = angular.merge(
          {},
          vm.files[index],
          _obj
        );
      }
    }


    /**
     * When the files has been uploaded have errors
     * @memberof invenioFilesController
     * @function fileUplaodedError
     */
    function fileUploadedError(evnt, data) {
      var index = findInFiles(data.config.data.file.name);
      if (index > -1) {
        vm.files[index].errored = true;
        $scope.$broadcast('invenio.uploader.error', data);
      }
    }

    /**
     * When the file progress updated
     * @memberof invenioFilesController
     * @function fileUplaodedProgress
     */
    function fileUploadedProgress(evnt, data) {
      var index = findInFiles(data.file.name);
      if (index > -1) {
        vm.files[index].progress = data.progress;
      }
    }

    /**
     * When the app has error
     * @memberof invenioFilesController
     * @function invenioFilesError
     */
    function invenioFilesError(evt, data) {
      vm.invenioFilesError = {};
      vm.invenioFilesError = data;
    }

    /**
     * When the app has warning
     * @memberof invenioFilesController
     * @function invenioFilesWarning
     */
    function invenioFilesWarning(evt, data) {
      vm.invenioFilesWarning = {};
      vm.invenioFilesWarning = data;
    }

    /**
     * When the uploader starts
     * @memberof invenioFilesController
     * @function invenioUploaderStarted
     */
    function invenioUploaderStarted(evt) {
      vm.invenioFilesError = {};
      vm.invenioFilesBusy = true;
    }

    /**
     * When the uploader uploads completed
     * @memberof invenioFilesController
     * @function invenioUploaderCompleted
     */
    function invenioUploaderCompleted() {
      $timeout(function() {
        vm.invenioFilesBusy = false;
      }, 10);
    }

    /**
     * Reinitialize uploader after cancelation
     * @memberof invenioFilesController
     * @function reinitializeUploader
     */
    function reinitializeUploader() {
      _.each(vm.files, function(file, index) {
        // Clean progress and error
        if (file.progress !== undefined && file.progress < 100) {
          // Those are incomplete send DELETE request
          var args = angular.copy(vm.invenioFilesArgs);
          args.method = 'DELETE';
          args.url = args.url + '/' + file.key;
          invenioFilesAPI.request(args).then(function(response) {
            // Just remove it from the list
            $scope.$broadcast('invenio.uploader.file.deleted', file);
            // Reinit the file
            delete vm.files[index].progress;
            delete vm.files[index].errored;
          }, function(response) {
            $scope.$broadcast('invenio.uploader.error', response);
          });
        }
        if (file.completed === undefined) {
          Uploader.pushToQueue(file);
        }
      });
    }

    /**
     * When uploader uploads canceled
     * @memberof invenioFilesController
     * @function invenioUploaderCanceled
     */
    function invenioUploaderCanceled() {
      // Reinitialize the uploader with all pending files
      invenioUploaderCompleted();
      reinitializeUploader();
    }

    ////////////

    // Add file to the list
    vm.addFiles = addFiles;
    // Cancel uploading files
    vm.cancel = invenioFilesUploadCancel;
    // Files cache
    vm.files = [];
    // Get the completed files
    vm.getCompleted = getCompleted;
    // If the uploader still running
    vm.invenioFilesBusy = false;
    // Any errors to report?
    vm.invenioFilesError = {};
    // Remove file from the list
    vm.remove = removeFile;
    // Start the upload
    vm.upload = upload;

    ////////////

    // Listeners

    // Initialize the uploader
    $scope.$on(
      'invenio.uploader.initialazation',
      invenioUploaderInitialization
    );

    // General uplaoder events
    $scope.$on('invenio.uploader.error', invenioFilesError);
    $scope.$on('invenio.uploader.warning', invenioFilesWarning);

    // Global file event
    $rootScope.$on(
      'invenio.uploader.upload.file.uploaded', fileUploadedSuccess
    );
    $rootScope.$on(
      'invenio.uploader.upload.file.errored', fileUploadedError);

    $rootScope.$on(
      'invenio.uploader.upload.file.progress', fileUploadedProgress
    );

    // Global upload event
    $rootScope.$on(
      'invenio.uploader.upload.started', invenioUploaderStarted
    );
    $rootScope.$on(
      'invenio.uploader.upload.completed', invenioUploaderCompleted
    );
    $rootScope.$on(
      'invenio.uploader.upload.canceled', invenioUploaderCanceled
    );

    // When the bucket_id is empty we should retrieve it from events
    $rootScope.$on(
      'invenio.records.endpoints.updated', invenioFilesEndpointsUpdated
    );

    ////////////
  }

  invenioFilesController.$inject = [
    '$rootScope', '$scope', '$q', '$timeout', 'invenioFilesAPI',
    'invenioFilesUploaderModel'
  ];

  ////////////

  // Directives

  /**
   * @ngdoc directive
   * @name invenioFilesUplaoder
   * @description
   *    The invenio files uploader directive handler
   * @namespace invenioFilesUploader
   * @example
   *    Usage:
   *     <invenio-files-uploader
   *       method="PUT"
   *       endpoint="http://localhost:5000/files"
   *       extra-params='{"resumeChunkSize": 900000}'
   *     >
   *     </invenio-files-uploader>
   */
  function invenioFilesUploader() {

    // Functions

    /**
     * Initialize uploader
     * @memberof invenioFilesUploader
     * @param {service} scope -  The scope of this element.
     * @param {service} element - Element that this direcive is assigned to.
     * @param {service} attrs - Attribute of this element.
     * @param {invenioFilesController} vm - Invenio uploader controller.
     */
    function link(scope, element, attrs, vm) {
      // Get the endpoints for schemas
      var endpoints = {
        bucket: attrs.bucket || undefined,
        initialization: attrs.initialization || undefined,
      };

      var params = JSON.parse(attrs.extraParams || '{}');

      var files = JSON.parse(attrs.files || '[]');

      // Brodcast ready to initialization
      scope.$broadcast('invenio.uploader.initialazation',
        params,
        endpoints,
        files
      );
    }

    ////////////

    return {
      restricted: 'AE',
      scope: false,
      controller: 'invenioFilesController',
      controllerAs: 'filesVM',
      link: link,
    };
  }

  /**
   * @ngdoc directive
   * @name invenioFilesError
   * @description
   *    The invenio files error directive handler
   * @namespace invenioFilesError
   * @example
   *    Usage:
   *      <invenio-files-error
   *        template="/src/invenio-files-js/templates/error.html"
   *       ></invenio-files-error>
   */
  function invenioFilesError() {

    /**
     * Initialize uploader
     * @memberof invenioFilesError
     * @param {service} scope -  The scope of this element.
     * @param {service} element - Element that this direcive is assigned to.
     * @param {service} attrs - Attribute of this element.
     * @param {invenioFilesController} vm - Invenio uploader controller.
     */
    function link(scope, element, attrs, vm) {
      scope.errorMessage = attrs.errorMessage || 'Error';
    }

    /**
     * Choose template for error messages
     * @memberof invenioFilesError
     * @param {service} element - Element that this direcive is assigned to.
     * @param {service} attrs - Attribute of this element.
     * @example
     *    Minimal template `template.html` usage
     *      {{ vm.invenioFilesError.data.message }}
     */
    function templateUrl(element, attrs) {
      return attrs.template;
    }

    ////////////

    return {
      restricted: 'AE',
      require: '^invenioFilesUploader',
      scope: false,
      templateUrl: templateUrl,
      link: link,
    };
  }

  /**
   * @ngdoc directive
   * @name invenioFilesUploadZone
   * @description
   *    The invenio files upload directive handler
   * @namespace invenioSearch
   * @example
   *    Usage:
   *     <invenio-files-upload-zone
   *      template="/src/invenio-files-js/templates/upload.html"
   *     ></invenio-files-upload-zone>
   */
  function invenioFilesUploadZone() {

    /**
     * Choose template for upload button
     * @memberof invenioFilesUploadZone
     * @param {service} element - Element that this direcive is assigned to.
     * @param {service} attrs - Attribute of this element.
     * @example
     *    Minimal template `template.html` usage
     *     <button  class="btn btn-primary"
     *       ngf-max-size="20GB" ngf-multiple="true"
     *       ngf-keep="'distinct'"
     *       ngf-select="vm.addFiles($files)"
     *     >
     *       Click to select
     *     </button>
     */
    function templateUrl(element, attrs) {
      return attrs.template;
    }

    ////////////

    return {
      restricted: 'AE',
      require: '^invenioFilesUploader',
      scope: false,
      templateUrl: templateUrl,
    };
  }

  /**
   * @ngdoc directive
   * @name invenioFilesList
   * @description
   *    The invenio files list directive handler
   * @namespace invenioFilesList
   * @example
   *    Usage:
   *    <invenio-files-list
   *      template="/src/invenio-files-js/templates/list.html"
   *    ></invenio-files-list>
   */
  function invenioFilesList() {

    /**
     * Choose template for error messages
     * @memberof invenioFilesError
     * @param {service} element - Element that this direcive is assigned to.
     * @param {service} attrs - Attribute of this element.
     * @example
     *    Minimal template `template.html` usage
     *   <div class="sel-file" ng-repeat="f in vm.files | filter:fileSearch">
     *    {{ f.name }}
     *    </div>
     */
    function templateUrl(element, attrs) {
      return attrs.template;
    }

    ////////////

    return {
      restricted: 'AE',
      require: '^invenioFilesUploader',
      scope: false,
      templateUrl: templateUrl,
    };
  }

  ////////////

  // Services

  /**
   * @ngdoc service
   * @name invenioFilesAPI
   * @namespace invenioFilesAPI
   * @param {service} $http - Angular http requests service.
   * @param {service} Upload - The upload factory.
   * @description
   *     Call the files api
   */
  function invenioFilesAPI($http, Upload) {

    /**
     * Start upload
     * @memberof invenioFilesAPI
     * @param {object} args - The upload parameters.
     */
    function upload(args) {
      return Upload.upload(args);
    }

    /**
     * Make an $http request
     * @memberof invenioFilesAPI
     * @param {object} args - The request parameters.
     */
    function request(args) {
      return $http(args);
    }

    ////////////

    return {
      request: request,
      upload: upload
    };
  }

  invenioFilesAPI.$inject = ['$http', 'Upload'];


  ////////////

  // Factories

  /**
   * @ngdoc factory
   * @name invenioFilesUploaderModel
   * @namespace invenioFilesUploaderModel
   * @param {service} $http - Angular http requests service.
   * @param {service} $q - Angular promise services.
   * @param {service} invenioFilesAPI - The files api service.
   * @description
   *     Create a model to handle the uploads
   */
  function invenioFilesUploaderModel($rootScope, $q, invenioFilesAPI) {

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
            var upload = invenioFilesAPI
              .upload(_obj.uploadArgs);
            // Emit
            $rootScope.$emit('invenio.uploader.upload.file.init', file);
            // Add the upload to the list
            that.addUpload(upload);
            upload.then(
                function(response) {
                  var params = (response.data.links === undefined) ? _obj.uploadArgs.url : response;
                  _obj.successCallback
                    .call(this, params)
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
      if (file.size < this.args.resumeChunkSize) {
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

    Uploader.prototype.postChunkUploadProcess = function(url) {
      var deferred = $q.defer();
      // Finishing up the chunk upload
      invenioFilesAPI.request({
        method: 'POST',
        url: url,
      }).then(function(response) {
        deferred.resolve(response);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    Uploader.prototype.postNormalUploadProcess = function(obj) {
      var deferred = $q.defer();
      deferred.resolve(obj);
      return deferred.promise;
    };

    Uploader.prototype._requestUploadID = function(args) {
      args.url = args.url+'?uploads=1&size='+ args.data.file.size + '&part_size='+ args.resumeChunkSize;
      return invenioFilesAPI.request(args);
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

  invenioFilesUploaderModel.$inject = ['$rootScope', '$q', 'invenioFilesAPI'];

  ////////////

  // Filters

  /**
   * @ngdoc filter
   * @name invenioFilesHumanReadable
   * @namespace invenioFilesHumanReadable
   * @description
   *     Filter to dispaly bits in human readable format
   */
  function invenioFilesHumanReadable() {
    function filter(size) {
      function round(num, precision) {
        return Math.round(
          num * Math.pow(10, precision)) / Math.pow(10, precision
        );
      }
      var limit = Math.pow(1024, 4);
      if (size > limit) {
        return round(size / limit, 1) + ' Tb';
      }
      if (size > (limit/=1024)) {
        return round(size / limit, 1) + ' Gb';
      }
      if (size > (limit/=1024)) {

        return round(size / limit, 1) + ' Mb';
      }
      if (size > 1024) {
        return Math.round(size / 1024) +  ' Kb';
      }
      return size + ' B';
    }

    ////////////

    return filter;
  }

  ////////////

  // Put everything together

  angular.module('invenioFiles.factories', [])
    .factory('invenioFilesUploaderModel', invenioFilesUploaderModel);

  angular.module('invenioFiles.controllers', [])
    .controller('invenioFilesController', invenioFilesController);

  angular.module('invenioFiles.filters', [])
    .filter('bytesToHumanReadable', invenioFilesHumanReadable);

  angular.module('invenioFiles.services', [])
    .service('invenioFilesAPI', invenioFilesAPI);

  angular.module('invenioFiles.directives', [])
    .directive('invenioFilesUploader', invenioFilesUploader)
    .directive('invenioFilesUploadZone', invenioFilesUploadZone)
    .directive('invenioFilesError', invenioFilesError)
    .directive('invenioFilesList', invenioFilesList);

  angular.module('invenioFiles', [
    'ngFileUpload',
    'invenioFiles.services',
    'invenioFiles.factories',
    'invenioFiles.filters',
    'invenioFiles.controllers',
    'invenioFiles.directives',
  ]);

  //////////// HAPPY UPLOADING :)

})(angular);
