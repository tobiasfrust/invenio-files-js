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
'use strict';

describe('Unit: testing the module', function() {

  var $controller;
  var $compile;
  var $httpBackend;
  var $rootScope;
  var $templateCache;
  var $timeout;
  var ctrl;
  var scope;
  var template;

  // Add some files for upload
  var _files = [
    {
      key: 'dare_devil.pdf',
      name: 'dare_devil.pdf',
      size: 900000,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    },
    {
      key: 'jessica_jones.pdf',
      name: 'jessica_jones.pdf',
      size: 14589255,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    },
    {
      key: 'the_punisher',
      name: 'the_punisher.pdf',
      size: 14589255,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    }
  ];

  var _smallFileResponse = {
    'mimetype': 'application/pdf',
    'updated': '2016-07-07T15:23:54.195989+00:00',
    'links': {
      'self': '/api/bucket_id/dare_devil.pdf',
      'uploads': '/api/bucket_id/dare_devil.pdf?uploads',
    },
    'is_head': true,
    'created': '2016-07-07T15:23:54.189913+00:00',
    'version_id': '3e0c214a-82a6-4c6a-bae4-55ed1e4fa182',
    'delete_marker': false,
    'key': 'dare_devil.pdf',
    'size': 900000
  };

  var _links = {
    links: {
      bucket: '/api/bucket_id',
      self: '/api/self',
      publish: '/api/publish',
      discard: '/api/discard',
      delete: '/api/delete'
    }
  };

  var _error = {
    message: 'Kilgrave is looking for Jessica Jones'
  };

  function directiveTemplate(api) {
    var _t = '<invenio-files-uploader ' +
        'method="PUT" ' +
        api +
        ' extra-params=\'{"resumeChunkSize": 9000000}\' ' +
        'files=\'[{"name": "Jessica Jones.pdf", "size": "2500000", "completed": true, "progress": 100}]\' ' +
      '>' +
        '<invenio-files-error ' +
          'template="src/invenio-files-js/templates/error.html" ' +
        '></invenio-files-error>' +
        '<invenio-files-upload-zone ' +
          'template="src/invenio-files-js/templates/upload.html" ' +
        '></invenio-files-upload-zone> ' +
        '<invenio-files-list ' +
          'template="src/invenio-files-js/templates/list.html" ' +
        '></invenio-files-list> ' +
      '</invenio-files-uploader>';
    // Compile
    template = $compile(_t)(scope);
    // Digest
    scope.$digest();
  }

  function uploadFiles() {
    scope.filesVM.addFiles(_files);
    // Digest
    scope.$digest();
    // 4 files on the UI
    expect(template.find('.sel-file').length).to.be.equal(4);
    // Check also in the controller
    expect(scope.filesVM.files.length).to.be.equal(4);
    // Call upload
    scope.filesVM.upload();
  }

  // Inject the angular module
  beforeEach(function() {
    // Load the templates
    angular.mock.module('templates');
    angular.mock.module('invenioFiles');
  });

  beforeEach(inject(function(
      _$controller_, _$compile_, _$httpBackend_, _$rootScope_, _$templateCache_, _$timeout_) {
    // Controller
    $controller = _$controller_;
    // Compile
    $compile = _$compile_;
    // http backend
    $httpBackend = _$httpBackend_;
    // The Scope
    $rootScope = _$rootScope_;
    // Set the scope
    scope = $rootScope;
    // Tempalte cache
    $templateCache = _$templateCache_;
    // Timeout
    $timeout = _$timeout_;

    // The controller
    ctrl = $controller('invenioFilesController', {
      $scope: scope,
    });
  }));


  it('should initialize the uploader with event', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // What request to expect
    $httpBackend.when('PUT', '/api/bucket_id/dare_devil.pdf')
      .respond(200, _smallFileResponse);


    // Call directiveTemplate
    directiveTemplate('bucket="/api/bucket_id"');
    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);
    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    scope.$broadcast('invenio.records.endpoints.updated', _links.links);

    // Digest
    scope.$digest();
    // Should trigger the event
    expect(spy.calledWith('invenio.records.endpoints.updated')).to.be.true;
    // Should initialize endpoints on request
    expect(scope.filesVM.invenioFilesEndpoints.self)
      .to.be.equal(_links.links.self);

    // Upload files
    uploadFiles();

    // Digest
    scope.$digest();

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();
    // Expect the file to be completed
    expect(scope.filesVM.files[1].completed).to.be.true;
  });

  it('should error the uploader with event', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // What request to expect
    $httpBackend.when('PUT', '/api/bucket_id/dare_devil.pdf')
      .respond(400, _error);


    // Call directiveTemplate
    directiveTemplate('bucket="/api/bucket_id"');
    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);
    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    scope.$broadcast('invenio.records.endpoints.updated', _links.links);

    // Digest
    scope.$digest();
    // Should trigger the event
    expect(spy.calledWith('invenio.records.endpoints.updated')).to.be.true;
    // Should initialize endpoints on request
    expect(scope.filesVM.invenioFilesEndpoints.self)
      .to.be.equal(_links.links.self);

    // Upload files
    uploadFiles();

    // Digest
    scope.$digest();

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();
    expect(scope.filesVM.invenioFilesError.data.message)
      .to.be.equal(_error.message);

    // Should trigger error
    expect(spy.calledWith('invenio.uploader.error')).to.be.true;
  });

  it('should initialize the uploader with request', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // What request to expect
    $httpBackend.when('POST', '/api/init')
      .respond(200, _links);

    // What request to expect
    $httpBackend.when('PUT', '/api/bucket_id/dare_devil.pdf')
      .respond(200, _smallFileResponse);

    // Call directiveTemplate
    directiveTemplate('initialization="/api/init"');
    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);

    // Digest
    scope.$digest();
    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    // Upload files
    uploadFiles();

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();

    // Should initialize endpoints on request
    expect(scope.filesVM.invenioFilesEndpoints.self)
      .to.be.equal(_links.links.self);

    // Expect the file to be completed
    expect(scope.filesVM.files[1].completed).to.be.true;
  });

  it('should error the uploader with request', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // What request to expect
    $httpBackend.when('POST', '/api/init')
      .respond(500, _error);

    // Call directiveTemplate
    directiveTemplate('initialization="/api/init"');
    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);

    // Digest
    scope.$digest();
    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    // Upload files
    uploadFiles();

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();

    expect(scope.filesVM.invenioFilesError.data.message)
      .to.be.equal(_error.message);
  });

  it('should remove file from the list', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // What request to expect
    $httpBackend.when('POST', '/api/init')
      .respond(200, _links);

    $httpBackend.when('DELETE', '/api/bucket_id/dare_devil.pdf')
      .respond(200, {});

    $httpBackend.when('DELETE', '/api/bucket_id/jessica_jones.pdf')
      .respond(403, {});

    // What request to expect
    $httpBackend.when('PUT', '/api/bucket_id/dare_devil.pdf')
      .respond(200, _smallFileResponse);

    // Call directiveTemplate
    directiveTemplate('initialization="/api/init"');
    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);

    // Digest
    scope.$digest();
    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    // Upload files
    uploadFiles();

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();

    // Should initialize endpoints on request
    expect(scope.filesVM.invenioFilesEndpoints.self)
      .to.be.equal(_links.links.self);

    // Expect the file to be completed
    expect(scope.filesVM.files[1].completed).to.be.true;

    scope.filesVM.remove(scope.filesVM.files[1]);

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();

    // Should trigger delete event
    expect(spy.calledWith('invenio.uploader.file.deleted')).to.be.true;

    // Digest
    scope.$digest();

    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(3);

    // Remove not uploaded file
    scope.filesVM.remove(scope.filesVM.files[2]);

    // Digest
    scope.$digest();

    // Should trigger delete event
    expect(spy.calledWith('invenio.uploader.file.deleted')).to.be.true;

    // Error the file
    scope.filesVM.files[1].completed = true;
    scope.filesVM.files[1].links = {
      self: '/api/bucket_id/jessica_jones.pdf'
    };

    // Remove uploaded file
    scope.filesVM.remove(scope.filesVM.files[1]);

    // Digest
    scope.$digest();

    // Flush HTTP
    $httpBackend.flush();

    // Should trigger delete event
    expect(spy.calledWith('invenio.uploader.error')).to.be.true;
  });

  it('should trigger warning for duplicate filename', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // Call directiveTemplate
    directiveTemplate('initialization="/api/init"');

    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);

    // Digest
    scope.$digest();

    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    // try to upload a file with the some name
    var file = {
      name: 'Jessica Jones.pdf'
    };
    scope.filesVM.addFiles([file]);

    // Digest
    scope.$digest();

    // Should trigger init
    expect(spy.calledWith('invenio.uploader.warning')).to.be.true;

    // Still should have only one file
    expect(template.find('.sel-file').length).to.be.equal(1);
  });

  it('should trigger change the busy state', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // Call directiveTemplate
    directiveTemplate('initialization="/api/init"');

    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);

    // Digest
    scope.$digest();

    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    expect(scope.filesVM.invenioFilesBusy).to.be.false;

    scope.$broadcast('invenio.uploader.upload.started');

    // Digest
    scope.$digest();

    expect(scope.filesVM.invenioFilesBusy).to.be.true;

    scope.$broadcast('invenio.uploader.upload.completed');

    // Digest
    scope.$digest();
    // Flush all pending timeouts
    $timeout.flush();

    expect(scope.filesVM.invenioFilesBusy).to.be.false;
  });

  it('should reinitialize uploader', function() {
    // Spy the broadcast
    var spy = sinon.spy($rootScope, '$broadcast');

    // What request to expect
    $httpBackend.when('POST', '/api/init')
      .respond(200, _links);

    $httpBackend.when('DELETE', 'undefined/jessica_jones.pdf')
      .respond(400, _error);

    $httpBackend.when('DELETE', '/api/bucket_id/jessica_jones.pdf')
      .respond(200, {});

    // What request to expect
    $httpBackend.when('PUT', '/api/bucket_id/dare_devil.pdf')
      .respond(200, _smallFileResponse);

    // Call directiveTemplate
    directiveTemplate('initialization="/api/init"');

    // One preloaded file
    expect(template.find('.sel-file').length).to.be.equal(1);

    // Digest
    scope.$digest();

    // Should trigger init
    expect(spy.calledWith('invenio.uploader.initialazation')).to.be.true;

    // Upload files
    uploadFiles();

    // Flush HTTP
    $httpBackend.flush();

    // Digest
    scope.$digest();

    // Should initialize endpoints on request
    expect(scope.filesVM.invenioFilesEndpoints.self)
      .to.be.equal(_links.links.self);


    // Expect the file to be completed
    expect(scope.filesVM.files[1].completed).to.be.true;

    // Artificialy change state
    scope.filesVM.files[2].progress = 30;

    scope.$broadcast('invenio.uploader.upload.canceled');

    // Flush
    $timeout.flush();

    // Digest
    scope.$digest();

    // Flush HTTP
    $httpBackend.flush();

    // Expect the file to be completed
    expect(scope.filesVM.files[1].completed).to.be.true;

    // Should trigger init
    expect(spy.calledWith('invenio.uploader.error')).to.be.true;

    // Should trigger init
    expect(spy.calledWith('invenio.uploader.file.deleted')).to.be.true;
  });
});
