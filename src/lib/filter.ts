import Vue from 'vue';
import moment from 'moment';

Vue.filter('DateFormat', function(value: string, fmt = 'YYYY-MM-DD hh:mm:ss.SSS') {
  return moment(value).format(fmt);
});

Vue.filter('toFixed', function(value: number, fixed = 2) {
  return value.toFixed(fixed);
});
