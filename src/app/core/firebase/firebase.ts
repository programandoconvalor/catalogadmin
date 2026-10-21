import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { environment } from '../../../environments/environment';

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

export const storage = getStorage(firebaseApp);

export { firebaseApp };