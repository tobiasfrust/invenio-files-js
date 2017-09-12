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
  var $interval;
  var ctrl;
  var scope;
  var template;

  // Add some files for upload
  var _remoteFiles = [
    {
      key: 'remote.pdf',
      name: 'remote.pdf',
      remote: true,
      size: 100,
      url: 'http://home.cern'
    }
  ];
  var _files = [
    {
      name: 'dare_devil.pdf',
      size: 900000,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    },
    {
      name: 'jessica_jones.pdf',
      size: 9999999999999999,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    },
    {
      name: 'the_punisher.pdf',
      size: 9999999999,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    },
    {
      name: 'harley_quinn.pdf',
      size: 9,
      type: 'application/pdf',
      lastModified: 1464785035000,
      lastModifiedDate: '2016-06-01T12:43:55.000Z'
    }
  ].concat(_remoteFiles);

  var _smallFileResponse = {
    'mimetype': 'application/pdf',
    'updated': '2016-07-07T15:23:54.195989+00:00',
    'links': {
      'self': '/api/bucket_id/dare_devil.pdf',
      'uploads': '/api/bucket_id/dare_devil.pdf?uploads',
    },
    'is_head': true,
    'created': '2016-07-07T15:23:54.189913+00:00',
    'version_id': 'v-e-r',
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
        ' extra-params=\'{"resumeChunkSize": 9000000, "headers": {"fight": "Jessica Jones v. Harley Quinn"}}\' ' +
        'files=\'[{"key": "Jessica Jones.pdf", "size": "2500000", "completed": true, "progress": 100}]\' ' +
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
        '<invenio-files-upload-remote ' +
          'template="src/invenio-files-js/templates/remote_upload.html" ' +
          'dropbox-selector=".dropbox-upload" ' +
          'dropbox-enabled="true" ' +
          'dropbox-app-key="DROPBOX-APP-KEY"' +
        '></invenio-files-upload-remote> ' +
      '</invenio-files-uploader>';
    // Compile
    template = $compile(_t)(scope);
    // Digest
    scope.$digest();
  }

  function uploadFiles() {
    scope.filesVM.addFiles(_files);
    // Digest
    scope.$apply();
    // 5 files on the UI
    expect(template.find('.sel-file').length).to.be.equal(6);
    // Check also in the controller
    expect(scope.filesVM.files.length).to.be.equal(6);
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
      _$controller_, _$compile_, _$httpBackend_, _$rootScope_, _$templateCache_, _$timeout_, _$interval_) {
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
    // Interval
    $interval = _$interval_;

    // The controller
    ctrl = $controller('InvenioFilesCtrl', {
      $scope: scope,
    });
  }));

  it('should have the correct file sizes', function() {
    // Call directiveTemplate
    directiveTemplate('bucket="/api/bucket_id"');
    // Upload files
    uploadFiles();
    // Expect the files to have the correct size
    expect(template.find('.sel-file').eq(0).find('td').eq(1).text()).to.be.equal('2.4 Mb');
    expect(template.find('.sel-file').eq(1).find('td').eq(1).text()).to.be.equal('879 Kb');
    expect(template.find('.sel-file').eq(2).find('td').eq(1).text()).to.be.equal('9094.9 Tb');
    expect(template.find('.sel-file').eq(3).find('td').eq(1).text()).to.be.equal('9.3 Gb');
    expect(template.find('.sel-file').eq(4).find('td').eq(1).text()).to.be.equal('9 B');
    expect(template.find('.sel-file').eq(5).find('td').eq(1).text()).to.be.equal('100 B');
  });

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

    scope.$broadcast('invenio.records.endpoints.updated', _links.links);

    // Digest
    scope.$digest();
    // Should trigger the event
    expect(spy.calledWith('invenio.records.endpoints.updated')).to.be.true;
    // Should initialize endpoints on request
    expect(scope.filesVM.invenioFilesEndpoints.self)
      .to.be.equal(_links.links.self);
    var _headers = {
      'Content-Type': 'application/json',
      fight: 'Jessica Jones v. Harley Quinn'
    };
    expect(scope.filesVM.invenioFilesArgs.headers)
      .to.deep.equal(_headers);
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

    // Update the progress
    $rootScope.$broadcast('invenio.uploader.upload.file.progress', {
      file: {
        key: 'harley_quinn.pdf'
      },
      progress: 20
    });
    // Digest
    scope.$digest();
    // Expect the file to be completed
    expect(scope.filesVM.files[4].progress).to.be.equal(20);
    // Update the processing
    $rootScope.$broadcast('invenio.uploader.upload.file.processing', {
      file: {
        key: 'jessica_jones.pdf'
      }
    });
    // Digest
    scope.$digest();
    // Expect the file to be completed
    expect(scope.filesVM.files[2].processing).to.be.equal(true);
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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

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

    $httpBackend.when('DELETE', '/api/bucket_id/dare_devil.pdf?versionId=v-e-r')
      .respond(200, {});

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

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
    expect(template.find('.sel-file').length).to.be.equal(5);

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

    // try to upload a file with the some name
    var file = {
      key: 'Jessica Jones.pdf'
    };
    scope.filesVM.addFiles([file]);

    // Digest
    scope.$digest();

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

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
    expect(spy.calledWith('invenio.uploader.init')).to.be.true;

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
    expect(spy.calledWith('invenio.uploader.file.deleted')).to.be.true;

    scope.filesVM.cancel();

    // Digest
    scope.$apply();

    // Should trigger cancel
    expect(spy.calledWith('invenio.uploader.upload.canceled')).to.be.true;
  });

  it('should upload by Dropbox', function() {
    var resp = {
      size: 100,
      total: 1000
    };

    // Call directiveTemplate
    directiveTemplate('bucket="/api/bucket_id"');
    $httpBackend.when('POST', '/api/bucket_id/remote.pdf?remote=true').respond(200, {
      id: 123456,
      links: _links,
      upload_key: 'remote.pdf'
    });
    $httpBackend.when('GET', '/api/bucket_id/remote.pdf?remote=true&remoteId=123456').respond(function() {
      return [200, resp];
    });

    // Upload files
    scope.filesVM.addFiles(_remoteFiles);

    // Digest
    scope.$digest();

    // Call upload
    scope.filesVM.upload();

    // Digest
    scope.$digest();
    $httpBackend.flush();

    // Get the progress
    $interval.flush(1000);
    $httpBackend.flush();
    scope.$digest();

    // Expect the progress to be 10%
    expect(scope.filesVM.files[1].progress).to.be.equal(10);

    resp.size = 800;

    // Get the new progress
    $interval.flush(1000);
    $httpBackend.flush();
    scope.$digest();
    // Expect the progress to be 80%

    expect(scope.filesVM.files[1].progress).to.be.equal(80);

    resp = { done: true };

    // Get the new progress
    $interval.flush(1000);
    $httpBackend.flush();
    scope.$digest();

    // Expect the progress to be 100%
    expect(scope.filesVM.files[1].progress).to.be.equal(100);
  });

  it('should upload by URL and error', function() {
    // Spy on $broadcast
    var spy = sinon.spy($rootScope, '$emit');

    // Call directiveTemplate
    directiveTemplate('bucket="/api/bucket_id"');
    $httpBackend.when('POST', '/api/bucket_id/remote.pdf?remote=true').respond(200, {
      id: 123456,
      links: _links,
      upload_key: 'remote.pdf'
    });
    $httpBackend.when('GET', '/api/bucket_id/remote.pdf?remote=true&remoteId=123456').respond(400, {});
    $httpBackend.when('HEAD', 'http://www.cern.com/remote.pdf?a=100').respond(200, {}, {
      'Content-Length': 10000
    });

    // Upload file by URL
    template.find('invenio-files-upload-remote').scope().startUrlUpload('http://www.cern.com/remote.pdf?a=100');3

    // Digest
    $httpBackend.flush();
    scope.$digest();

    // Call upload
    scope.filesVM.upload();

    // Digest
    scope.$digest();
    $httpBackend.flush();

    // Get the progress
    $interval.flush(1000);
    $httpBackend.flush();
    scope.$digest();

    // Expect file upload error emission
    expect(spy.calledWith('invenio.uploader.upload.file.errored')).to.be.true;
  });

  it('should cancel uploads', function() {
    // Spy on $broadcast
    var emit = sinon.spy($rootScope, '$emit');
    var delay = sinon.spy(_, 'delay');

    // Call directiveTemplate
    directiveTemplate('bucket="/api/bucket_id"');
    $httpBackend.when('POST', '/api/bucket_id/remote.pdf?remote=true').respond(200, {
      id: 123456,
      links: _links,
      upload_key: 'remote.pdf'
    });
    $httpBackend.when('HEAD', 'http://www.cern.com/remote.pdf?a=100').respond(200, {}, {
      'Content-Length': 10000
    });

    // Upload file by URL
    template.find('invenio-files-upload-remote').scope().startUrlUpload('http://www.cern.com/remote.pdf?a=100');

    // Digest
    $httpBackend.flush();
    scope.$digest();

    // Call upload
    scope.filesVM.upload();

    // Digest
    scope.$digest();
    $httpBackend.flush();

    // Cancel uploads
    scope.filesVM.cancel();
    scope.$digest();
    $timeout.flush(100);


    expect(delay.calledOnce).to.be.true;

    // Call the delayed method
    delay.firstCall.args[0]();

    // Expect file upload cancel emission
    expect(emit.calledWith('invenio.uploader.upload.canceled')).to.be.true;
  });

});
