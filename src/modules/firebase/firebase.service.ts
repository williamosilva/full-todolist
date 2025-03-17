import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  private firebaseApp: firebase.app.App;

  constructor(private configService: ConfigService) {
    this.initFirebase();
  }

  private initFirebase() {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const privateKey = this.configService
      .get('FIREBASE_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

    if (!this.firebaseApp) {
      this.firebaseApp = firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    }
  }

  getAuth() {
    return this.firebaseApp.auth();
  }
}
