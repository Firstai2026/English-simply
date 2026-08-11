export async function storageGet(key) {
    try {
      const v = localStorage.getItem('dc:' + key);
      return v === null ? null : v;
    } catch (e) {
      return null;
    }
  }
  
  export async function storageSet(key, value) {
    try {
      localStorage.setItem('dc:' + key, value);
    } catch (e) {
      console.error('storage set failed', key, e);
    }
  }
  
  export async function storageDelete(key) {
    try {
      localStorage.removeItem('dc:' + key);
    } catch (e) {}
  }