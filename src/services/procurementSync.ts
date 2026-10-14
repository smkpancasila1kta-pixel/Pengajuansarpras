import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProcurementItem } from '../types/procurement';

export const ITEMS_COLLECTION = 'procurement_items';
export const SETTINGS_COLLECTION = 'procurement_settings';

export interface ProcurementSettingsSync {
  id: string;
  ownerId: string;
  fiscalYear: string;
  npsn?: string;
  pemohonName?: string;
  customLogo?: string;
  updatedAt?: string;
}

export function sanitizeProcurementItem(item: ProcurementItem, ownerId: string) {
  const clean: Record<string, any> = {
    id: String(item.id),
    ownerId: String(ownerId),
    code: String(item.code || ''),
    date: String(item.date || new Date().toISOString().split('T')[0]),
    unit: String(item.unit || 'Kakonsen TKR'),
    type: item.type === 'Jasa' ? 'Jasa' : 'Barang',
    category: String(item.category || 'Operasional'),
    itemName: String(item.itemName || ''),
    quantity: Math.max(0, Number(item.quantity) || 0),
    unitMeasure: String(item.unitMeasure || 'Pcs'),
    unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    totalPrice: Math.max(0, (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
    priority: (['Tinggi', 'Sedang', 'Rendah'].includes(item.priority) ? item.priority : 'Sedang'),
    status: (['Draft', 'Diajukan', 'Disetujui', 'Proses Beli', 'Selesai', 'Ditolak'].includes(item.status) ? item.status : 'Draft'),
  };

  if (item.spec && item.spec.trim()) {
    clean.spec = String(item.spec).slice(0, 1000);
  }
  if (item.notes && item.notes.trim()) {
    clean.notes = String(item.notes).slice(0, 1000);
  }
  if (item.vendor && item.vendor.trim()) {
    clean.vendor = String(item.vendor).slice(0, 256);
  }
  clean.updatedAt = new Date().toISOString();

  return clean;
}

/**
 * Subscribe to real-time changes for items owned by this user
 */
export function subscribeToUserItems(
  user: User,
  onData: (items: ProcurementItem[]) => void,
  onError: (err: unknown) => void
) {
  const q = query(
    collection(db, ITEMS_COLLECTION),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const serverItems: ProcurementItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        serverItems.push({
          id: data.id || docSnap.id,
          code: data.code || '',
          date: data.date || '',
          unit: data.unit || 'Kakonsen TKR',
          type: data.type || 'Barang',
          category: data.category || '',
          itemName: data.itemName || '',
          spec: data.spec || '',
          quantity: Number(data.quantity) || 0,
          unitMeasure: data.unitMeasure || 'Pcs',
          unitPrice: Number(data.unitPrice) || 0,
          totalPrice: Number(data.totalPrice) || 0,
          priority: data.priority || 'Sedang',
          status: data.status || 'Draft',
          notes: data.notes || '',
          vendor: data.vendor || '',
        });
      });

      // Maintain stable sort by date or order
      serverItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onData(serverItems);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, ITEMS_COLLECTION);
      onError(err);
    }
  );
}

/**
 * Save / Update a single procurement item to Firestore
 */
export async function syncSaveItem(item: ProcurementItem, user: User) {
  const path = `${ITEMS_COLLECTION}/${item.id}`;
  try {
    const clean = sanitizeProcurementItem(item, user.uid);
    await setDoc(doc(db, ITEMS_COLLECTION, item.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a single procurement item permanently from Firestore
 */
export async function syncDeleteItem(itemId: string, user: User) {
  const path = `${ITEMS_COLLECTION}/${itemId}`;
  try {
    await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Delete multiple items permanently from Firestore in batch
 */
export async function syncDeleteMultipleItems(itemIds: string[], user: User) {
  if (itemIds.length === 0) return;
  const path = ITEMS_COLLECTION;
  try {
    const batch = writeBatch(db);
    itemIds.forEach((id) => {
      batch.delete(doc(db, ITEMS_COLLECTION, id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Push all items (e.g. migration on first Google login if Firestore is empty)
 */
export async function syncUploadInitialItems(items: ProcurementItem[], user: User) {
  if (items.length === 0) return;
  const path = ITEMS_COLLECTION;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const clean = sanitizeProcurementItem(item, user.uid);
      batch.set(doc(db, ITEMS_COLLECTION, item.id), clean);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to settings sync (fiscal year, logo, etc.)
 */
export function subscribeToUserSettings(
  user: User,
  onData: (settings: ProcurementSettingsSync) => void
) {
  return onSnapshot(
    doc(db, SETTINGS_COLLECTION, user.uid),
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as ProcurementSettingsSync);
      }
    },
    (err) => {
      console.warn('Error reading user settings:', err);
    }
  );
}

/**
 * Save user settings to Firestore
 */
export async function syncSaveUserSettings(
  settings: Partial<ProcurementSettingsSync>,
  user: User
) {
  const path = `${SETTINGS_COLLECTION}/${user.uid}`;
  try {
    const clean: Record<string, any> = {
      id: user.uid,
      ownerId: user.uid,
      fiscalYear: settings.fiscalYear || '2027',
      updatedAt: new Date().toISOString(),
    };
    if (settings.npsn) clean.npsn = settings.npsn.slice(0, 32);
    if (settings.pemohonName) clean.pemohonName = settings.pemohonName.slice(0, 128);
    if (settings.customLogo && settings.customLogo.length < 490000) {
      clean.customLogo = settings.customLogo;
    }
    await setDoc(doc(db, SETTINGS_COLLECTION, user.uid), clean, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
