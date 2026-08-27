const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

const rawItemsRegex = /const rawItems: \{ el: any, tp: any, atpItem: any \}\[\] = \[\];\s+\(data\?\.elements \|\| \[\]\)\.forEach\(\(el\) => \{\s+\(el\.allocations \|\| \[\]\)\.forEach\(\(alloc\) => \{\s+if \(alloc\.structuredAtp\) \{\s+alloc\.structuredAtp\.forEach\(\(grp: any\) => \{\s+grp\.atpItems\.forEach\(\(atpItem: any\) => \{\s+rawItems\.push\(\{ el, tp: grp\.tp, atpItem \}\);\s+\}\);\s+\}\);\s+\}\s+\}\);\s+\}\);/;

code = code.replace(rawItemsRegex, `
      const rawItems: { el: any, tp: any, atpItem: any }[] = [];
      const currentSelected = selectedAtps[className] || {};
      const hasSelection = Object.keys(currentSelected).length > 0 && Object.values(currentSelected).some(v => v);

      (data?.elements || []).forEach((el, elIdx) => {
          (el.allocations || []).forEach((alloc) => {
              if (alloc.structuredAtp) {
                  alloc.structuredAtp.forEach((grp: any, grpIdx) => {
                       grp.atpItems.forEach((atpItem: any, itemIdx) => {
                           const key = \`\${elIdx}-\${grpIdx}-\${itemIdx}\`;
                           if (!hasSelection || currentSelected[key]) {
                               rawItems.push({ el, tp: grp.tp, atpItem });
                           }
                       });
                  });
              }
          });
      });
`);

const aiPromptRegex = /SANGAT PENTING:[\s\S]*?INFORMASI UMUM:/;
code = code.replace(aiPromptRegex, `SANGAT PENTING: 
                      - Gunakan Model Pembelajaran berikut: \${modelResponseText}
                      - Modul Ajar harus secara eksplisit mengintegrasikan prinsip 8,3,3,4 secara mendalam pada setiap tahapan kegiatan, yakni:
                        * 8 Dimensi Profil Lulusan: Keimanan, Kewargaan, Penalaran kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi.
                        * 3 Prinsip Pembelajaran: Berkesadaran (Mindful), Bermakna (Meaningful), Menggembirakan (Joyful).
                        * 3 Pengalaman Belajar: Memahami, Mengaplikasikan, Merefleksikan.
                        * 4 Kerangka Pembelajaran: Praktik Pedagogis, Kemitraan Pembelajaran, Lingkungan Pembelajaran, Pemanfaatan Teknologi Digital.
                      
                      INFORMASI UMUM:`);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 7');
