const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

const kelurBtn = `
                        <button 
                            onClick={() => {
                                const currentKey = localStorage.getItem('prota_custom_api_key') || '';
                                const newKey = prompt('Masukkan API Key Gemini Anda:', currentKey);
                                if (newKey !== null) {
                                    localStorage.setItem('prota_custom_api_key', newKey.trim());
                                    setApiKeyInput(newKey.trim());
                                    alert('API Key berhasil disimpan!');
                                    window.location.reload();
                                }
                            }}
                            className="p-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            title="Pengaturan API Key"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="hidden md:inline text-sm font-medium">API Key</span>
                        </button>
                        <button 
                            onClick={handleLogout}
`;

code = code.replace(/<button \s*onClick=\{handleLogout\}/, kelurBtn);
fs.writeFileSync('index.tsx', code);
console.log('Done replacement 5');
