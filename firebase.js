        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"; import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

        const firebaseConfig = {
            apiKey: "AIzaSyCB13klyU4YBhs3yo1nOgdvyj0Dl9KVYvk",
            authDomain: "unigateway-2356.firebaseapp.com",
            projectId: "unigateway-2356",
            storageBucket: "unigateway-2356.firebasestorage.app",
            messagingSenderId: "1009496385569",
            appId: "1:1009496385569:web:15fcb57da91b4ad51bdb60",
            measurementId: "G-JZWVF399EE"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        window._db = db;
        window._fsCollection = collection;
        window._fsAddDoc = addDoc;
        window._fsQuery = query;
        window._fsOrderBy = orderBy;
        window._fsLimit = limit;
        window._fsOnSnapshot = onSnapshot;
        window._fsServerTimestamp = serverTimestamp;
        window._fsDoc = doc;
        window._fsSetDoc = setDoc;

        function playLoginAnimation(userName) {
            const animDiv = document.getElementById('loginAnimation');
            const nameDiv = document.getElementById('welcomeName');
            animDiv.style.display = 'flex';
            nameDiv.textContent = `Welcome, ${userName}!`;
            nameDiv.style.opacity = '1';
            setTimeout(() => {
                animDiv.style.display = 'none';
                nameDiv.style.opacity = '0';
                document.getElementById('displayUserName').textContent = userName;
                document.getElementById('userNameDisplay').style.opacity = '1';
                loadUserCalculatorData();
            }, 800);
        }

        onAuthStateChanged(auth, (user) => {
            if (user) {
                window.currentUserId = user.uid;
                const fullName = user.displayName || 'Student';
                const firstName = fullName.split(' ')[0];
                document.getElementById('view-auth').style.display = 'none';
                playLoginAnimation(firstName);
                setTimeout(() => { document.getElementById('mainNav').style.display = 'block'; }, 900);
            } else {
                window.currentUserId = null;
                document.getElementById('view-auth').style.display = 'flex';
                document.getElementById('mainNav').style.display = 'none';
                document.getElementById('userNameDisplay').style.opacity = '0';
            }
        });

        window.attemptRegister = async () => {
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPassword').value;
            const btn = document.getElementById('regBtn');
            if (!name || !email || !pass) { alert("Please fill all fields!"); return; }
            // Basic email format check
            const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) { alert("Please enter a valid email address."); return; }
            // ✅ WHITELIST: Only these email domains are allowed. Add or remove as needed.
            const ALLOWED_EMAIL_DOMAINS = [
                'gmail.com',
                'yahoo.com',
                'outlook.com',
                'hotmail.com',
                'live.com',
                'icloud.com',
                'aol.com',
                'protonmail.com',
                'zoho.com',
                'yandex.com',
                'mail.com',
            ];
            const domain = email.split('@')[1].toLowerCase();
            const isAllowed = ALLOWED_EMAIL_DOMAINS.includes(domain);
            if (!isAllowed) { alert("This email domain is not allowed. Please use a valid email (e.g., name@gmail.com, name@outlook.com)."); return; }
            if (pass.length < 6) { alert("Password must be at least 6 characters."); return; }
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(userCredential.user, { displayName: name });
            } catch (error) { alert(error.message); }
            finally { btn.innerHTML = originalText; }
        };

        window.attemptLogin = async () => {
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            const btn = document.getElementById('loginBtn');
            if (!email || !pass) { alert("Please enter email and password"); return; }
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try { await signInWithEmailAndPassword(auth, email, pass); }
            catch (error) { alert("Invalid Email or Password. Please try again."); }
            finally { btn.innerHTML = originalText; }
        };
        window.logoutApp = async () => {
            try {
                window.currentUserId = null;
                await signOut(auth);
                // Clear all listeners and memory for the next account
                window.location.reload();
            }
            catch (error) { alert("Error logging out."); }
        };
        window.updateUserProfile = async () => {
            const user = auth.currentUser;
            const newName = document.getElementById('updateName').value.trim();
            if (!newName) return alert("Please enter a name");

            try {
                await updateProfile(user, { displayName: newName });
                document.getElementById('displayUserName').textContent = newName.split(' ')[0];
                document.getElementById('profileNameDisplay').textContent = newName;
                document.getElementById('profileAvatar').textContent = newName.charAt(0).toUpperCase();
                alert("Profile Updated!");
            } catch (e) { alert(e.message); }
        };

        window.updateUserPassword = async () => {
            const user = auth.currentUser;
            const newPass = document.getElementById('newPassword').value;
            if (newPass.length < 6) return alert("Password too short!");

            try {
                await updatePassword(user, newPass);
                alert("Password Changed!");
                document.getElementById('newPassword').value = "";
            } catch (e) { alert("Please log out and log back in to verify it's you before changing the password."); }
        };

        const originalSwitchView = window.switchView;
        window.switchView = (viewName) => {
            if (viewName === 'profile') {
                const user = auth.currentUser;
                if (user) {
                    document.getElementById('updateName').value = user.displayName || '';
                    document.getElementById('profileNameDisplay').textContent = user.displayName || 'Student';
                    document.getElementById('profileAvatar').textContent = (user.displayName || 'S').charAt(0).toUpperCase();
                }
            }
            originalSwitchView(viewName);
        };
