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
    * @param {InvenioFilesCtrl} vm - Invenio uploader controller.
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
    controller: 'InvenioFilesCtrl',
    controllerAs: 'filesVM',
    link: link,
  };
}

angular.module('invenioFiles.directives')
  .directive('invenioFilesUploader', invenioFilesUploader);
