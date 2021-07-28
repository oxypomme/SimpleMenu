import { SMContent, SMContentKeys, SMContext, SMContextEntry, SMHandler } from '.';

const isSMContent = (e: SMContextEntry): e is SMContent => {
  if (e && typeof e === 'object') {
    for (const key of Object.keys(e)) {
      if (!(SMContentKeys.includes(key))) {
        return false;
      }
    }
    return true;
  }
  return false;
};

const isSMContext = (e: SMContextEntry): e is SMContext =>
  e && typeof e === 'object' ? !isSMContent(e) : false;

const isSMHandler = (e: SMContextEntry): e is SMHandler =>
  !!e && typeof e === 'function';

export { isSMContent, isSMContext, isSMHandler };
