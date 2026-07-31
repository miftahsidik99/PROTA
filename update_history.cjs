const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

const backupButtons = `
                            <div className="flex items-center gap-2">
                                <button onClick={handleBackup} className="text-xs flex items-center gap-1 font-semibold bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <FileDown className="w-3.5 h-3.5" /> Backup Database
                                </button>
                                <label className="text-xs flex items-center gap-1 font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                                    <FileOutput className="w-3.5 h-3.5" /> Restore Database
                                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                                </label>
                                <button onClick={clearAllActivities} className="text-xs flex items-center gap-1 font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                                </button>
                            </div>
`;

code = code.replace(/<button onClick=\{clearAllActivities\}[\s\S]*?Hapus Semua\s*<\/button>/, backupButtons);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 4');
