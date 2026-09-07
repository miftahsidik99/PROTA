const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

// Replace useEffect for firebaseUser
const firebaseUserEffectRegex = /const \[firebaseUser.*?\}, \[\]\);/s;
code = code.replace(firebaseUserEffectRegex, `
  useEffect(() => {
    const savedUser = localStorage.getItem('prota_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);
`);

// Replace activities fetch
const fetchActivitiesRegex = /useEffect\(\(\) => \{\s+const fetchActivities = async \(\) => \{[\s\S]*?fetchActivities\(\);\s+\}, \[firebaseUser\]\);/;
code = code.replace(fetchActivitiesRegex, `
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      try {
        const data = await activitiesDB.getItem(user.email);
        if (data && Array.isArray(data)) {
            setActivities(data);
        } else {
            setActivities([]);
        }
      } catch (e) {
        console.error("Failed to fetch activities", e);
      }
    };
    fetchActivities();
  }, [user]);
`);

// Replace addActivity
const addActivityRegex = /const addActivity = async \([\s\S]*?catch \(e\) \{\s+console.error\("Failed to add activity to Firestore", e\);\s+\}\s+\};/;
code = code.replace(addActivityRegex, `
  const addActivity = async (type: 'CP_TP' | 'ATP_JP' | 'MODUL_AJAR', subject: string, details: string, dataSnapshot: any) => {
    if (!user) return;
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      subject,
      details,
      dataSnapshot: JSON.parse(JSON.stringify(dataSnapshot)),
      paperSizeSnapshot: paperSize
    };
    try {
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = [newActivity, ...prev];
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to add activity", e);
    }
  };
`);

// Replace saveActivityLog
const saveActivityLogRegex = /const saveActivityLog = async \([\s\S]*?catch \(e\) \{\s+console.error\("Failed to save activity log to Firestore", e\);\s+\}\s+\};/;
code = code.replace(saveActivityLogRegex, `
  const saveActivityLog = async (log: ActivityLog) => {
    if (!user) return;
    try {
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = [log, ...prev];
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to save activity log", e);
    }
  };
`);

// Replace deleteActivity
const deleteActivityRegex = /const deleteActivity = async \([\s\S]*?setActivities\(prev => prev.filter\(a => a.id !== id\)\);\s+\} catch \(e\) \{\s+console.error\("Failed to delete activity", e\);\s+\}\s+\};/;
code = code.replace(deleteActivityRegex, `
  const deleteActivity = async (id: string) => {
    if (!user) return;
    try {
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = prev.filter(a => a.id !== id);
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to delete activity", e);
    }
  };
`);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 2');
