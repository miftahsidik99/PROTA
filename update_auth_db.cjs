const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

code = code.replace(/import \{ initializeApp \} from 'firebase\/app';/g, '');
code = code.replace(/import \{ initializeAuth[^;]+;/g, "import localforage from 'localforage';");
code = code.replace(/import \{ getFirestore[^;]+;/g, '');
code = code.replace(/import firebaseConfig from '.\/firebase-applet-config.json';/g, '');
code = code.replace(/const app = initializeApp\(firebaseConfig\);/g, '');
code = code.replace(/export const db = getFirestore[^;]+;/g, '');
code = code.replace(/export const auth = initializeAuth[^]+?}\);/g, `
export const activitiesDB = localforage.createInstance({ name: 'ProtaApp', storeName: 'activities' });
export const usersDB = localforage.createInstance({ name: 'ProtaApp', storeName: 'users' });
`);

// Backup & Restore
const backupRestoreCode = `
  const handleBackup = async () => {
    try {
      if (!user) return;
      const data = await activitiesDB.getItem(user.email) || [];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`backup_prota_\${user.email}_\${formatDateLocal(new Date())}.json\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert('Gagal melakukan backup');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
          await activitiesDB.setItem(user.email, parsed);
          setActivities(parsed);
          alert('Berhasil merestore data!');
      } else {
          alert('Format file tidak valid.');
      }
    } catch(err) {
      alert('Gagal merestore data');
    }
    if (e.target) e.target.value = '';
  };
`;

code = code.replace(/const \[user, setUser\] = useState<\{ name: string, email: string \} \| null>\(null\);/g, 
`const [user, setUser] = useState<{ name: string, email: string } | null>(null);
${backupRestoreCode}
const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('prota_custom_api_key') || '');
const [selectedAtps, setSelectedAtps] = useState<Record<string, Record<string, boolean>>>({});
`);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 1');
