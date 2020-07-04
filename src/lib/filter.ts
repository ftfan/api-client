import Vue from 'vue';
import moment from 'moment';

Vue.filter('DateFormat', function(value: string, fmt = 'YYYY-MM-DD hh:mm:ss') {
  return moment(value).format(fmt);
});
