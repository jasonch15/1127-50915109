import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  push,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Firebase 配置（保持不變）
const firebaseConfig = {
  apiKey: "AIzaSyAUi_whIkhj7figYOMqRP-tQOUnvoUNi1Q",
  authDomain: "login-ead0d.firebaseapp.com",
  databaseURL:
    "https://login-ead0d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "login-ead0d",
  storageBucket: "login-ead0d.firebasestorage.app",
  messagingSenderId: "278988806452",
  appId: "1:278988806452:web:5ca9c10139b7a00f4aad61",
  measurementId: "G-Y2C6RJK5QF",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

// 顯示通知函數（保持不變）
function showNotification(message, type) {
  const colors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 translate-x-full`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    notification.style.transform = "translateX(full)";
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

// 顯示使用者資訊
function displayUserInfo(userInfo) {
  const { displayName, email, photoURL, lastLoginTime } = userInfo;

  document.getElementById("user-info").innerHTML = `
        <div class="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-4">
            <div class="flex items-center">
                <img src="${photoURL}" alt="Profile Picture" class="w-16 h-16 rounded-full mr-4"/>
                <div>
                    <h2 class="text-xl font-bold text-white">${displayName}</h2>
                    <p class="text-gray-300">${email}</p>
                </div>
            </div>
        </div>
    `;
}

// 取得筆記列表
function fetchNotes(uid) {
  const notesRef = ref(database, `users/${uid}/notes`);
  onValue(notesRef, (snapshot) => {
    const notesList = document.getElementById("notes-list");
    notesList.innerHTML = ""; // 清空當前筆記列表

    if (snapshot.exists()) {
      const notes = snapshot.val();
      Object.keys(notes).forEach((noteId) => {
        const note = notes[noteId];
        const noteElement = createNoteElement(uid, noteId, note.content);
        notesList.appendChild(noteElement);
      });
    } else {
      notesList.innerHTML = '<p class="text-gray-300">尚未新增任何筆記</p>';
    }
  });
}

// 創建筆記列表項目元素
function createNoteElement(uid, noteId, content) {
  const li = document.createElement("li");
  li.classList.add(
    "bg-white",
    "bg-opacity-10",
    "rounded-lg",
    "p-4",
    "flex",
    "justify-between",
    "items-center",
    "text-white"
  );

  const noteContent = document.createElement("div");
  noteContent.textContent = content;
  noteContent.classList.add("flex-grow", "mr-4", "break-words");

  const actionDiv = document.createElement("div");
  actionDiv.classList.add("flex", "space-x-2");

  const editButton = document.createElement("button");
  editButton.innerHTML = "編輯";
  editButton.classList.add(
    "bg-yellow-500",
    "text-white",
    "px-3",
    "py-1",
    "rounded",
    "hover:bg-yellow-600"
  );
  editButton.addEventListener("click", () => editNote(uid, noteId, content));

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "刪除";
  deleteButton.classList.add(
    "bg-red-500",
    "text-white",
    "px-3",
    "py-1",
    "rounded",
    "hover:bg-red-600"
  );
  deleteButton.addEventListener("click", () => deleteNote(uid, noteId));

  actionDiv.appendChild(editButton);
  actionDiv.appendChild(deleteButton);

  li.appendChild(noteContent);
  li.appendChild(actionDiv);

  return li;
}

// 新增筆記
function addNote(uid, content) {
  const notesRef = ref(database, `users/${uid}/notes`);
  const newNoteRef = push(notesRef);
  set(newNoteRef, { content });
  showNotification("筆記新增成功！", "success");
}

// 編輯筆記
function editNote(uid, noteId, currentContent) {
  const newContent = prompt("編輯筆記內容：", currentContent);
  if (newContent && newContent.trim() !== "") {
    const noteRef = ref(database, `users/${uid}/notes/${noteId}`);
    update(noteRef, { content: newContent });
    showNotification("筆記編輯成功！", "success");
  }
}

// 刪除筆記
function deleteNote(uid, noteId) {
  if (confirm("確定要刪除此筆記嗎？")) {
    const noteRef = ref(database, `users/${uid}/notes/${noteId}`);
    remove(noteRef);
    showNotification("筆記刪除成功！", "success");
  }
}

// Google 登入
async function googleLogin() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("登入失敗:", error);
    showNotification("登入失敗！", "error");
  }
}

// Google 註冊
async function googleRegister() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const uid = user.uid;
    const { displayName, email, photoURL } = user;

    const userRef = ref(database, "users/" + uid);
    set(userRef, {
      displayName,
      email,
      photoURL,
      lastLoginTime: new Date().toISOString(),
    });
    showNotification("註冊成功！", "success");
  } catch (error) {
    console.error("註冊失敗:", error);
    showNotification("註冊失敗！", "error");
  }
}

// 登出功能
function logout() {
  auth
    .signOut()
    .then(() => {
      showNotification("已成功登出！", "success");
    })
    .catch((error) => {
      console.error("登出失敗:", error);
      showNotification("登出失敗！", "error");
    });
}

// 監聽用戶狀態變化
onAuthStateChanged(auth, (user) => {
  const authSection = document.getElementById("auth-section");
  const notesSection = document.getElementById("notes-section");

  if (user) {
    // 用戶已登入
    authSection.classList.add("hidden");
    notesSection.classList.remove("hidden");

    // 顯示用戶資訊
    displayUserInfo({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });

    // 載入筆記
    fetchNotes(user.uid);
  } else {
    // 用戶未登入
    authSection.classList.remove("hidden");
    notesSection.classList.add("hidden");
  }
});

// 綁定事件
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("register-button")
    .addEventListener("click", googleRegister);
  document
    .getElementById("login-button")
    .addEventListener("click", googleLogin);
  document.getElementById("logout-button").addEventListener("click", logout);

  // 筆記表單提交事件
  document.getElementById("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const noteInput = document.getElementById("note-input");
    const content = noteInput.value.trim();

    const user = auth.currentUser;
    if (user && content) {
      addNote(user.uid, content);
      noteInput.value = ""; // 清空輸入框
    } else if (!user) {
      showNotification("請先登入！", "warning");
    } else {
      showNotification("請輸入筆記內容！", "warning");
    }
  });
});
