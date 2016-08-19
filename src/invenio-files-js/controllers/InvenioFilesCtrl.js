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
  * @ngdoc controller
  * @name InvenioFilesCtrl
  * @namespace InvenioFilesCtrl
  * @description
  *    Invenio files controller.
  */
function InvenioFilesCtrl($rootScope, $scope, $q, $timeout,
  InvenioFilesAPI, InvenioFilesUploaderModel) {

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
    * @memberof InvenioFilesCtrl
    * @function upload
    */
  function getEndpoints(){
    var deferred = $q.defer();
    if (vm.invenioFilesEndpoints.bucket === undefined) {
      // If the action url doesnt exists request it
      InvenioFilesAPI.request({
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
    * @memberof InvenioFilesCtrl
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
    * @memberof InvenioFilesCtrl
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
    * @memberof InvenioFilesCtrl
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
    * @memberof InvenioFilesCtrl
    * @function getCompleted
    */
  function getCompleted() {
    return _.reject(vm.files, function(file) {
      return file.completed === undefined;
    });
  }

  /**
    * Remove the file from the list and from server if is uploaded
    * @memberof InvenioFilesCtrl
    * @function removeFile
    */
  function removeFile(file) {
    if (file.completed !== undefined) {
      // Prepare parameters
      var args = angular.copy(vm.invenioFilesArgs);
      args.method = 'DELETE';

      if (file.multipart === true) {
        args.url = (file.completed && file.links.object_version) ?
          file.links.object_version : file.links.self;
      } else {
        args.url = (file.links.version) ?
          file.links.version : file.links.self;
      }

      InvenioFilesAPI.request(args).then(function(response) {
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
      lastModifiedDate: file.lastModifiedDate,
      multipart: (file.size > vm.invenioFilesArgs.resumeChunkSize) ? true : false
    };
  }

  /**
    * Add files to the list
    * @memberof InvenioFilesCtrl
    * @function addFiles
    */
  function addFiles(files) {
    _.each(files, function(file, index) {
      if (_.findWhere(vm.files, {name: file.name}) === undefined) {
        var _file = fileReducer(file);
        // Add files to the model
        vm.files.push(_file);
        // Added to queue
        Uploader.pushToQueue(file);
      }
    });
  }

  /**
    * Cancel all active uploads
    * @memberof InvenioFilesCtrl
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
    * @memberof InvenioFilesCtrl
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
      delete vm.files[index].processing;
      vm.files[index] = angular.merge(
        {},
        vm.files[index],
        _obj
      );
    }
  }


  /**
    * When the files has been uploaded have errors
    * @memberof InvenioFilesCtrl
    * @function fileUplaodedError
    */
  function fileUploadedError(evnt, data) {
    var index = findInFiles(
      data.config.data.file !== undefined ?
        data.config.data.file.name : data.config.data.name
    );
    if (index > -1) {
      vm.files[index].errored = true;
      delete vm.files[index].processing;
      $scope.$broadcast('invenio.uploader.error', data);
    }
  }

  /**
    * When the file progress updated
    * @memberof InvenioFilesCtrl
    * @function fileUplaodedProgress
    */
  function fileUploadedProgress(evnt, data) {
    var index = findInFiles(
      data.file !== undefined ? data.file.name : data.name
    );
    if (index > -1) {
      vm.files[index].progress = data.progress;
    }
  }

  /**
    * When the file chunk is processing
    * @memberof InvenioFilesCtrl
    * @function fileUplaodedProcessing
    */
  function fileUploadedProcessing(evnt, data) {
    var index = findInFiles(data.file.name);
    if (index > -1) {
      delete vm.files[index].progress;
      vm.files[index].processing = true;
    }
  }

  /**
    * When the app has error
    * @memberof InvenioFilesCtrl
    * @function invenioFilesError
    */
  function invenioFilesError(evt, data) {
    vm.invenioFilesError = {};
    vm.invenioFilesError = data;
  }

  /**
    * When the uploader starts
    * @memberof InvenioFilesCtrl
    * @function invenioUploaderStarted
    */
  function invenioUploaderStarted(evt) {
    vm.invenioFilesError = {};
    vm.invenioFilesBusy = true;
  }

  /**
    * When the uploader uploads completed
    * @memberof InvenioFilesCtrl
    * @function invenioUploaderCompleted
    */
  function invenioUploaderCompleted() {
    $timeout(function() {
      vm.invenioFilesBusy = false;
    }, 10);
  }

  /**
    * Reinitialize uploader after cancelation
    * @memberof InvenioFilesCtrl
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
        InvenioFilesAPI.request(args).then(function(response) {
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
    * @memberof InvenioFilesCtrl
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

  // Global file event
  $rootScope.$on(
    'invenio.uploader.upload.file.uploaded', fileUploadedSuccess
  );
  $rootScope.$on(
    'invenio.uploader.upload.file.errored', fileUploadedError);

  $rootScope.$on(
    'invenio.uploader.upload.file.progress', fileUploadedProgress
  );

  $rootScope.$on(
    'invenio.uploader.upload.file.processing', fileUploadedProcessing
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

InvenioFilesCtrl.$inject = [
  '$rootScope', '$scope', '$q', '$timeout', 'InvenioFilesAPI',
  'InvenioFilesUploaderModel'
];

angular.module('invenioFiles.controllers')
  .controller('InvenioFilesCtrl', InvenioFilesCtrl);
