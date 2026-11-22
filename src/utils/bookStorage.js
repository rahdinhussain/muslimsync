import * as FS from 'expo-file-system/legacy';
import BlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const site = 'https://muslimsync.com';
const root = FS.documentDirectory + 'books-v1/';
const catalogKey = '@books.catalog.v1';
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const active = new Map();
function folder(id) {
  if (!uuid.test(id)) throw Error('Invalid book ID');
  return root + id + '/';
}
export const bookUrl = id => site + '/api/books/files/' + encodeURIComponent(id);
export const bookPageKey = id => '@book.page.' + id;

export async function cachedCatalog() {
  const raw = await AsyncStorage.getItem(catalogKey);
  if(raw) {
    try {
      const data=JSON.parse(raw);
      if(Array.isArray(data?.categories) && Array.isArray(data?.books)) return data;
    } catch { /* Refresh an unreadable catalog from the network. */ }
  }
  return {categories:[],books:[]};
}
export async function refreshCatalog(signal) {
  const res = await fetch(site + '/api/books', {signal,headers:{Accept:'application/json'}});
  if (!res.ok) throw Error('Catalog unavailable');
  const catalog = await res.json();
  if (!Array.isArray(catalog.books) || !Array.isArray(catalog.categories)) throw Error('Invalid catalog');
  await AsyncStorage.setItem(catalogKey, JSON.stringify(catalog));
  return catalog;
}
export async function savedBooks() {
  const dir = await FS.getInfoAsync(root);
  if (!dir.exists) return {};
  const ids = (await FS.readDirectoryAsync(root)).filter(id=>uuid.test(id));
  const rows = await Promise.all(ids.map(async id=>{
    try {
      const book = JSON.parse(await FS.readAsStringAsync(folder(id)+'book.json'));
      const uri = folder(id)+'content.pdf';
      const file = await FS.getInfoAsync(uri);
      if (book.id === id && file.exists && file.size === book.file_bytes) return [id,{...book,uri}];
    } catch { /* Interrupted or externally removed file. */ }
    return null;
  }));
  return Object.fromEntries(rows.filter(Boolean));
}
export function saveBook(book, onProgress) {
  if (!active.has(book.id)) active.set(book.id, download(book,onProgress).finally(()=>active.delete(book.id)));
  return active.get(book.id);
}
async function download(book, onProgress) {
  const dest = folder(book.id);
  const saved = (await savedBooks())[book.id];
  if (saved?.sha256 === book.sha256) return saved;
  await FS.makeDirectoryAsync(root,{intermediates:true});
  const temp = root + 'pending-' + book.id + '/';
  await FS.deleteAsync(temp,{idempotent:true});
  await FS.makeDirectoryAsync(temp,{intermediates:true});
  try {
    const task = FS.createDownloadResumable(bookUrl(book.id), temp+'content.pdf', {}, progress=>{
      onProgress?.(Math.min(1,progress.totalBytesWritten/book.file_bytes));
    });
    const file = await task.downloadAsync();
    if (file?.status !== 200) throw Error('Incomplete download');
    const info = await FS.getInfoAsync(file.uri);
    if (!info.exists || info.size !== book.file_bytes) throw Error('Incomplete download');
    const digest = await BlobUtil.fs.hash(decodeURIComponent(file.uri.replace(/^file:\/\//,'')),'sha256');
    if (digest.toLowerCase() !== book.sha256) throw Error('Damaged PDF');
    await FS.writeAsStringAsync(temp+'book.json',JSON.stringify(book));
    await FS.deleteAsync(dest,{idempotent:true});
    await FS.moveAsync({from:temp,to:dest});
    return {...book,uri:dest+'content.pdf'};
  } finally { await FS.deleteAsync(temp,{idempotent:true}).catch(()=>{}); }
}
export async function removeBook(id) {
  if (active.has(id)) await active.get(id);
  await FS.deleteAsync(folder(id),{idempotent:true});
}
