const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

const tableHeaderRegex = /<th className="px-4 py-3 border w-1\/4">Alur Tujuan Pembelajaran \(ATP\)<\/th>/;
code = code.replace(tableHeaderRegex, `
<th className="px-4 py-3 border w-1/4">
  <div className="flex items-center gap-2">
      Alur Tujuan Pembelajaran (ATP)
      <button 
          onClick={() => {
              const currentClass = selectedAtps[className] || {};
              const allChecked = Object.keys(currentClass).length > 0 && Object.values(currentClass).every(v => v);
              const newSelection = {};
              if (!allChecked) {
                  (data.elements || []).forEach((el, elIdx) => {
                      const allocIdx = (el.allocations || []).findIndex(a => a.className === className);
                      const alloc = (el.allocations || [])[allocIdx];
                      if (!alloc) return;
                      const groups = alloc.structuredAtp || [];
                      groups.forEach((grp, grpIdx) => {
                          grp.atpItems.forEach((_, itemIdx) => {
                              newSelection[\`\${elIdx}-\${grpIdx}-\${itemIdx}\`] = true;
                          });
                      });
                  });
              }
              setSelectedAtps(prev => ({...prev, [className]: newSelection}));
          }}
          className="text-[10px] bg-white border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-50"
      >
          Pilih Semua
      </button>
  </div>
</th>
`);

const atpCellRegex = /<td className="px-4 py-3 border align-top bg-green-50\/20">\s*\{item\.alur \? <div className="flex gap-2"><span className="font-bold text-green-600">\{itemIdx\+1\}\.<\/span>\{item\.alur\}<\/div> : <span className="text-gray-400 italic">Belum digenerate<\/span>\}\s*<\/td>/;

code = code.replace(atpCellRegex, `
<td className={\`px-4 py-3 border align-top \${activities.some(a => a.type === 'MODUL_AJAR' && a.subject === data.subject && a.details.includes(item.alur?.substring(0, 30) || 'xxx')) ? 'bg-indigo-100/50' : 'bg-green-50/20'}\`}>
    {item.alur ? (
        <div className="flex gap-2">
            <input 
                type="checkbox" 
                checked={!!(selectedAtps[className] && selectedAtps[className][\`\${elIdx}-\${grpIdx}-\${itemIdx}\`])}
                onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedAtps(prev => ({
                        ...prev,
                        [className]: {
                            ...(prev[className] || {}),
                            [\`\${elIdx}-\${grpIdx}-\${itemIdx}\`]: checked
                        }
                    }));
                }}
                className="mt-1"
            />
            <div className="flex flex-col">
                <div className="flex gap-1 items-start">
                    <span className="font-bold text-green-600">{itemIdx+1}.</span>
                    <span>{item.alur}</span>
                </div>
                {activities.some(a => a.type === 'MODUL_AJAR' && a.subject === data.subject && a.details.includes(item.alur.substring(0, 30))) && (
                    <span className="mt-1 inline-block text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded w-fit">
                        ✓ Modul Dibuat
                    </span>
                )}
            </div>
        </div>
    ) : <span className="text-gray-400 italic">Belum digenerate</span>}
</td>
`);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 6');
