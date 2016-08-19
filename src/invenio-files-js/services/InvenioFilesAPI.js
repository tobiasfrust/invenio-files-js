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
  * @ngdoc service
  * @name InvenioFilesAPI
  * @namespace InvenioFilesAPI
  * @param {service} $http - Angular http requests service.
  * @param {service} Upload - The upload factory.
  * @description
  *     Call the files api
  */
function InvenioFilesAPI($http, Upload) {

  /**
    * Start upload
    * @memberof InvenioFilesAPI
    * @param {object} args - The upload parameters.
    * @param {boolean} multipartUpload - If the upload is multipart.
    */
  function upload(args, multipartUpload) {
    if (multipartUpload) {
      return Upload.upload(args);
    }
      return Upload.http(args);
  }

  /**
    * Make an $http request
    * @memberof InvenioFilesAPI
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

InvenioFilesAPI.$inject = [
  '$http',
  'Upload'
];

angular.module('invenioFiles.services')
  .service('InvenioFilesAPI', InvenioFilesAPI);
