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

angular.module('invenioFiles.directives')
  .directive('invenioFilesUploadZone', invenioFilesUploadZone);
