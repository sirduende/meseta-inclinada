// Firebase Interop for Blazor WebAssembly - Meseta Inclinada
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStorage = null;

window.firebaseInterop = {
    async initialize(config) {
        try {
            if (!firebaseApp) {
                firebaseApp = firebase.initializeApp(config);
                firebaseAuth = firebase.auth();
                firebaseDb = firebase.firestore();
                firebaseStorage = firebase.storage();
                console.log('Firebase initialized successfully');
            }
            return true;
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            return false;
        }
    },

    // === AUTH ===

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebaseAuth.signInWithPopup(provider);
            return {
                success: true,
                user: {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL
                }
            };
        } catch (error) {
            console.error('Error signing in:', error);
            return { success: false, error: error.message };
        }
    },

    async signOut() {
        try {
            await firebaseAuth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getCurrentUser() {
        const user = firebaseAuth.currentUser;
        if (user) return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
        return null;
    },

    onAuthStateChanged(dotNetHelper) {
        return firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                dotNetHelper.invokeMethodAsync('OnAuthStateChanged', {
                    uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL
                });
            } else {
                dotNetHelper.invokeMethodAsync('OnAuthStateChanged', null);
            }
        });
    },

    // === ROLES ===

    async isAdmin(uid) {
        try {
            const docSnap = await firebaseDb.collection('roles').doc(uid).get();
            const isAdmin = docSnap.exists && docSnap.data().admin === true;
            return { success: true, data: isAdmin };
        } catch (error) {
            console.error('Error checking admin role:', error);
            return { success: false, data: false, error: error.message };
        }
    },

    // === RUTAS ===

    async getRutasByYear(year) {
        try {
            const snapshot = await firebaseDb.collection('rutas').get();
            let rutas = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: String(doc.id),   // siempre string, siempre último para no ser sobreescrito por data.id numérico
                    fecha: data.fecha instanceof firebase.firestore.Timestamp
                        ? data.fecha.toDate().toISOString().substring(0, 10)
                        : (data.fecha || '')
                };
            });

            if (year) {
                const yearStr = String(year);
                rutas = rutas.filter(r => {
                    const f = r.fecha;
                    if (!f) return false;
                    return String(f).substring(0, 4) === yearStr;
                });
            }

            rutas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            return { success: true, data: rutas };
        } catch (error) {
            console.error('Error getting rutas:', error);
            return { success: false, error: error.message };
        }
    },

    async getRuta(id) {
        try {
            const doc = await firebaseDb.collection('rutas').doc(id).get();
            if (!doc.exists) return { success: false, error: 'Ruta no encontrada' };
            const data = doc.data();
            return {
                success: true,
                data: {
                    id: doc.id,
                    ...data,
                    fecha: data.fecha instanceof firebase.firestore.Timestamp
                        ? data.fecha.toDate().toISOString().substring(0, 10)
                        : (data.fecha || '')
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async saveRuta(id, data) {
        try {
            await firebaseDb.collection('rutas').doc(id).set(data);
            return { success: true };
        } catch (error) {
            console.error('Error saving ruta:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteRuta(id) {
        try {
            await firebaseDb.collection('rutas').doc(id).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getNextRutaId() {
        try {
            const snapshot = await firebaseDb.collection('rutas').get();
            const ids = snapshot.docs
                .map(doc => parseInt(doc.data().id))
                .filter(n => !isNaN(n));
            const maxId = ids.length ? Math.max(...ids) : 0;
            return { success: true, data: String(maxId + 1) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getParticipantesUnicos() {
        try {
            const snapshot = await firebaseDb.collection('rutas').get();
            const nombres = new Set();
            snapshot.docs.forEach(doc => {
                const ruta = doc.data();
                if (Array.isArray(ruta.participantes)) {
                    ruta.participantes.forEach(n => nombres.add(n));
                }
            });
            return { success: true, data: Array.from(nombres).sort() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // === CUMBRES ===

    async getCumbres() {
        try {
            const snapshot = await firebaseDb.collection('cumbresFDMESCYL').get();
            const lista = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: Number(doc.id),
                    nombre: data.nombre,
                    lat: data.lat,
                    lng: data.lng,
                    cubierta: data.cubierta === true,
                    orden: data.orden ?? Number(doc.id)
                };
            });
            lista.sort((a, b) => a.orden - b.orden);
            return { success: true, data: lista };
        } catch (error) {
            console.error('Error getting cumbres:', error);
            return { success: false, error: error.message };
        }
    },

    async toggleCumbre(id, cubierta) {
        try {
            await firebaseDb.collection('cumbresFDMESCYL').doc(String(id)).update({ cubierta });
            return { success: true };
        } catch (error) {
            console.error('Error toggling cumbre:', error);
            return { success: false, error: error.message };
        }
    },

    async patchRutaMetricas(id, metricas) {
        try {
            await firebaseDb.collection('rutas').doc(id).update(metricas);
            console.log(`📐 Métricas guardadas en Firestore para ruta ${id}`);
            return { success: true };
        } catch (error) {
            console.warn(`No se pudieron guardar métricas para ruta ${id}:`, error.message);
            return { success: false, error: error.message };
        }
    },

    // === MIEMBROS Y SOLICITUDES ===

    async isMember(uid) {
        try {
            const docSnap = await firebaseDb.collection('roles').doc(uid).get();
            const isMember = docSnap.exists && docSnap.data().miembro === true;
            return { success: true, data: isMember };
        } catch (error) {
            return { success: false, data: false, error: error.message };
        }
    },

    async getRolData(uid) {
        try {
            const docSnap = await firebaseDb.collection('roles').doc(uid).get();
            if (!docSnap.exists) return { success: true, data: null };
            return { success: true, data: docSnap.data() };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    },

    async getMembers() {
        try {
            const snapshot = await firebaseDb.collection('roles').get();
            const members = snapshot.docs
                .filter(doc => doc.data().admin === true || doc.data().miembro === true)
                .map(doc => ({
                    uid: doc.id,
                    email: doc.data().email || '',
                    nombreMostrado: doc.data().nombreMostrado || '',
                    esAdmin: doc.data().admin === true
                }));
            return { success: true, data: members };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    },

    async saveMember(uid, data) {
        try {
            const docRef = firebaseDb.collection('roles').doc(uid);
            const existing = await docRef.get();
            const isAdminDoc = existing.exists && existing.data().admin === true;
            const payload = { email: data.email || '', nombreMostrado: data.nombreMostrado || '' };
            if (!isAdminDoc) payload.miembro = true;
            await docRef.set(payload, { merge: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteMember(uid) {
        try {
            const docRef = firebaseDb.collection('roles').doc(uid);
            const doc = await docRef.get();
            if (doc.exists && doc.data().admin === true) {
                // Si también es admin, solo quitamos el campo miembro
                await docRef.update({ miembro: firebase.firestore.FieldValue.delete() });
            } else {
                await docRef.delete();
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getSolicitudes() {
        try {
            const snapshot = await firebaseDb.collection('solicitudes').get();
            const lista = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
            return { success: true, data: lista };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    },

    async saveSolicitud(uid, data) {
        try {
            await firebaseDb.collection('solicitudes').doc(uid).set(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteSolicitud(uid) {
        try {
            await firebaseDb.collection('solicitudes').doc(uid).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // === INVITACIONES ===

    async getInvitaciones() {
        try {
            const snapshot = await firebaseDb.collection('invitaciones').get();
            const lista = snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));
            return { success: true, data: lista };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    },

    async saveInvitacion(email, data) {
        try {
            const id = email.toLowerCase().replace(/[.#$/[\]]/g, '_');
            await firebaseDb.collection('invitaciones').doc(id).set({ email, ...data });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteInvitacion(email) {
        try {
            const id = email.toLowerCase().replace(/[.#$/[\]]/g, '_');
            await firebaseDb.collection('invitaciones').doc(id).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async checkInvitacion(email) {
        try {
            const id = email.toLowerCase().replace(/[.#$/[\]]/g, '_');
            const doc = await firebaseDb.collection('invitaciones').doc(id).get();
            if (!doc.exists) return { success: true, data: null };
            return { success: true, data: { email: doc.id, ...doc.data() } };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    },

    // === PROPUESTAS ===

    async getPropuestas() {
        try {
            const snapshot = await firebaseDb.collection('propuestas').get();
            const lista = snapshot.docs.map(doc => ({
                firestoreId: doc.id,
                ...doc.data()
            }));
            lista.sort((a, b) => (a.cumbrePrincipal || '').localeCompare(b.cumbrePrincipal || ''));
            return { success: true, data: lista };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    },

    async savePropuesta(id, data) {
        try {
            if (id) {
                await firebaseDb.collection('propuestas').doc(id).set(data);
            } else {
                await firebaseDb.collection('propuestas').add(data);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deletePropuesta(id) {
        try {
            await firebaseDb.collection('propuestas').doc(id).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // === AVATARES ===

    async getAvatarConfigs() {
        try {
            const snap = await firebaseDb.collection('avatares').get();
            const data = snap.docs.map(d => ({ nombre: d.id, ...d.data() }));
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getAvatarConfig(nombre) {
        try {
            const doc = await firebaseDb.collection('avatares').doc(nombre).get();
            if (!doc.exists) return { success: false };
            return { success: true, data: { nombre: doc.id, ...doc.data() } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async saveAvatarConfig(nombre, data) {
        try {
            // set() sin merge para sobrescribir limpio (evita campos huérfanos de versiones anteriores)
            await firebaseDb.collection('avatares').doc(nombre).set(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // === GASTRO ===

    async getGastroSitios() {
        try {
            const snap = await firebaseDb.collection('gastro').get();
            const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
            return { success: true, data };
        } catch (error) {
            console.error('Error getting gastro sitios:', error);
            return { success: false, error: error.message };
        }
    },

    async saveGastroSitio(id, data) {
        try {
            if (id) {
                await firebaseDb.collection('gastro').doc(id).set(data);
            } else {
                await firebaseDb.collection('gastro').add(data);
            }
            return { success: true };
        } catch (error) {
            console.error('Error saving gastro sitio:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteGastroSitio(id) {
        try {
            await firebaseDb.collection('gastro').doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting gastro sitio:', error);
            return { success: false, error: error.message };
        }
    },

    // === STORAGE - GPX ===

    async uploadGpx(filename, fileBytes, contentType) {
        try {
            const ref = firebaseStorage.ref('gpx/' + filename);
            const blob = new Blob([new Uint8Array(fileBytes)], { type: contentType });
            await ref.put(blob, { contentType });
            return { success: true };
        } catch (error) {
            console.error('Error uploading GPX:', error);
            return { success: false, error: error.message };
        }
    },

    async getGPXUrl(nombreArchivo) {
        // Intentar local en gpx/ y gpx2026/ antes de ir a Storage
        const carpetasLocales = ['gpx', 'gpx2026'];
        for (const carpeta of carpetasLocales) {
            try {
                const localUrl = `${carpeta}/${nombreArchivo}`;
                const response = await fetch(localUrl);
                if (response.ok) {
                    console.log(`📂 GPX local (${carpeta}/): ${nombreArchivo}`);
                    return { success: true, data: localUrl };
                }
            } catch (e) { /* siguiente carpeta */ }
        }

        // Fallback a Firebase Storage
        try {
            const ref = firebaseStorage.ref('gpx/' + nombreArchivo);
            const remoteUrl = await ref.getDownloadURL();
            console.log(`GPX desde Firebase Storage: ${nombreArchivo}`);
            return { success: true, data: remoteUrl };
        } catch (error) {
            console.error('Error getting GPX URL:', error);
            return { success: false, error: error.message };
        }
    },

    // === UTILIDADES ===

    downloadJsonFile(filename, jsonData) {
        const dataStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
