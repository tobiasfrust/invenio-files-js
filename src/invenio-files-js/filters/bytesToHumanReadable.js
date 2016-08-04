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
  * @ngdoc filter
  * @name bytesToHumanReadable
  * @namespace bytesToHumanReadable
  * @description
  *     Filter to dispaly bits in human readable format
  */
function bytesToHumanReadable() {

  function filter(size) {
    function round(num, precision) {
      return Math.round(
        num * Math.pow(10, precision)) / Math.pow(10, precision
      );
    }
    var limit = Math.pow(1024, 4);
    if (size > limit) {
      return round(size / limit, 1) + ' Tb';
    } else if (size > (limit/=1024)) {
      return round(size / limit, 1) + ' Gb';
    } else if (size > (limit/=1024)) {
      return round(size / limit, 1) + ' Mb';
    } else if (size > 1024) {
      return Math.round(size / 1024) +  ' Kb';
    }
    return size + ' B';
  }

  ////////////

  return filter;
}

angular.module('invenioFiles.filters')
  .filter('bytesToHumanReadable', bytesToHumanReadable);
