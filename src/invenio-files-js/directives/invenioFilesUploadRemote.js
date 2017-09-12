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
  * @ngdoc directive
  * @name invenioFilesUploadRemote
  * @description
  *    The invenio files remote upload directive
  * @namespace invenioSearch
  * @example
  *    Usage:
  *     <invenio-files-upload-remote
  *      template="/src/invenio-files-js/templates/remote_upload.html"
  *      dropbox-enabled="true"
  *      dropbox-selector=".dropbox-upload"
  *      dropbox-app-key="DROPBOX-APP-KEY"
  *     ></invenio-files-upload-remote>
  */
function invenioFilesUploadRemote($http) {

  /**
    * Choose template for upload button
    * @memberof invenioFilesUploadRemote
    * @param {service} element - Element that this direcive is assigned to.
    * @param {service} attrs - Attribute of this element.
    * @example
    *    Minimal template `template.html` usage
    *     <div class="dropbox-upload"></div>
    *     <input type="text" ng-model="uploadUrl" />
    *     <button ng-click="startUrlUpload(uploadUrl)">Upload by URL</button>
    */
  function templateUrl(element, attrs) {
    return attrs.template;
  }

  ////////////

  return {
    link: function(scope, element, attrs, vm) {
      if (attrs.dropboxEnabled) {
        if (typeof Dropbox !== 'undefined') {
          Dropbox.appKey = attrs.dropboxAppKey;
          var button = Dropbox.createChooseButton({
            success: function (files) {
              angular.forEach(files, function (file) {
                var obj = {
                  key: file.name,
                  name: file.name,
                  size: file.bytes,
                  remote: true,
                  url: file.link
                };
                vm.files.push(obj);
                vm.pushToQueue(obj);
              });
            },
            linkType: 'direct'
          });
          element[0].querySelector(attrs.dropboxSelector).appendChild(button);
        } else {
          scope.dropboxError = 'Dropbox dropins.js is not loaded';
        }
      }

      scope.startUrlUpload = function(url) {
        var parser = document.createElement('a');
        parser.href = url;
        var name = parser.pathname.split('/').pop();
        var obj = {
          key: name,
          name: name,
          remote: true,
          url: url
        };
        $http.head(url).then(function(resp) {
          var fileSize = resp.headers()['content-length'];
          if (fileSize) {
            obj.size = +fileSize;
          }
        }).finally(function() {
          vm.files.push(obj);
          vm.pushToQueue(obj);
          });
      };
    },
    restricted: 'AE',
    require: '^invenioFilesUploader',
    scope: false,
    templateUrl: templateUrl,
  };
}

invenioFilesUploadRemote.$inject = ['$http'];

angular.module('invenioFiles.directives')
  .directive('invenioFilesUploadRemote', invenioFilesUploadRemote);
