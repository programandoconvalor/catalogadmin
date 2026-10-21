import { Injectable } from '@angular/core';

import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

import { BehaviorSubject } from 'rxjs';

import { auth } from '../firebase/firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSubject =
    new BehaviorSubject<User | null>(
      auth.currentUser
    );

  private readonly authInitializedSubject =
    new BehaviorSubject<boolean>(false);

  readonly user$ =
    this.userSubject.asObservable();

  readonly authInitialized$ =
    this.authInitializedSubject.asObservable();


  /*
   * ============================================
   * FIREBASE AUTH STATE
   * ============================================
   */

  constructor() {
    onAuthStateChanged(
      auth,
      (user) => {
        console.log(
          '[AuthService] Estado de autenticación:',
          user
            ? `Usuario ${user.email}`
            : 'Sin usuario'
        );

        this.userSubject.next(user);

        this.authInitializedSubject.next(
          true
        );
      }
    );
  }


  /*
   * ============================================
   * SIGN IN
   * ============================================
   */

  async signIn(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<User> {

    /*
     * Mantener sesión iniciada:
     *
     * true  → localStorage
     * false → sessionStorage
     */

    const persistence =
      rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;

    await setPersistence(
      auth,
      persistence
    );

    console.log(
      '[AuthService] Persistence:',
      rememberMe
        ? 'browserLocalPersistence'
        : 'browserSessionPersistence'
    );

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    /*
     * Firebase también actualizará este estado
     * mediante onAuthStateChanged.
     *
     * Lo actualizamos inmediatamente para que
     * cualquier consumidor tenga el usuario
     * disponible sin esperar otro ciclo.
     */

    this.userSubject.next(
      credential.user
    );

    return credential.user;
  }


  /*
   * ============================================
   * SIGN OUT
   * ============================================
   */

  async signOut(): Promise<void> {

    console.log(
      '[AuthService] Cerrando sesión...'
    );

    /*
     * Cerrar sesión real en Firebase.
     */

    await signOut(auth);

    /*
     * Limpiar inmediatamente el estado local.
     */

    this.userSubject.next(null);

    console.log(
      '[AuthService] Sesión cerrada correctamente.'
    );
  }


  /*
   * ============================================
   * CURRENT USER
   * ============================================
   */

  get currentUser(): User | null {
    return auth.currentUser;
  }


  /*
   * ============================================
   * AUTHENTICATED
   * ============================================
   */

  get isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }


  /*
   * ============================================
   * AUTH INITIALIZED
   * ============================================
   */

  get isAuthInitialized(): boolean {
    return this.authInitializedSubject.value;
  }
}