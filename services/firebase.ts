import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Using the config found in the project
const firebaseConfig = {
  apiKey: "AIzaSyCy8M9nilFwKQYLGyx2vQeFN0GoYCoB9_g",
  authDomain: "get-transfer-59edd.firebaseapp.com",
  projectId: "get-transfer-59edd",
  storageBucket: "get-transfer-59edd.firebasestorage.app",
  messagingSenderId: "16039729648",
  appId: "1:16039729648:web:a56ff750d13e3c0533e535",
  measurementId: "G-XB6JW3TN33"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
