import { helper } from '@ember/component/helper';

export function inc([val]: [number] /*, hash*/) {
  return val + 1;
}

export default helper(inc);
