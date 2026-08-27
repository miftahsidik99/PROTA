const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

const deleteActivityRegex = /const deleteActivity = async \([\s\S]*?console.error\("Failed to delete activity from Firestore", e\);\s+\}\s+\};/;
code = code.replace(deleteActivityRegex, `
  const deleteActivity = async (id: string) => {
    if (!user) return;
    try {
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = prev.filter(act => act.id !== id);
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to delete activity", e);
    }
  };
`);

const clearAllRegex = /const clearAllActivities = async \([\s\S]*?console.error\("Failed to clear activities from Firestore", e\);\s+\}\s+\};/;
code = code.replace(clearAllRegex, `
  const clearAllActivities = async () => {
    if (!user) return;
    try {
        await activitiesDB.setItem(user.email, []);
        setActivities([]);
    } catch (e) {
        console.error("Failed to clear activities", e);
    }
  };
`);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 8');
