const fs = require('fs');

let content = fs.readFileSync('index.tsx', 'utf8');

const regex = /for\s*\(let\s*i\s*=\s*0;\s*i\s*<\s*maxModules;\s*i\+\+\)\s*\{[\s\S]*?catch\s*\(err:\s*any\)\s*\{\s*console\.error\(`Error generating module \$\{i\+1\}:\s*\$\{err\}`\);\s*\}\s*\}/;

const replacement = `
          let combinedTopics = '';
          let combinedTPs = '';
          let totalJP = 0;
          let combinedDates = [];
          let combinedCPs = new Set<string>();

          for (let i = 0; i < maxModules; i++) {
              const { el, tp, atpItem } = itemsToGenerateFinal[i];
              combinedTopics += \`- \${atpItem.alur}\\n\`;
              combinedTPs += \`- \${tp}\\n\`;
              const jpMatch = String(atpItem.alokasiWaktu).match(/(\\d+)/);
              if (jpMatch) totalJP += parseInt(jpMatch[1]);
              if (atpItem.planDate) combinedDates.push(formatDateLocal(new Date(atpItem.planDate)));
              combinedCPs.add(el.capaianPembelajaran);
          }

          const dateString = combinedDates.length > 0 ? Array.from(new Set(combinedDates)).join(', ') : formatDateLocal(new Date());
          const combinedCPString = Array.from(combinedCPs).join('\\n');

          if ((window as any).bulkAbortedMap?.[className]) {
              setBulkGenerationStatus(prev => ({...prev, [className]: {...prev[className], active: false, statusText: "Proses dibatalkan."}}));
              return;
          }

          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { ...prev[className], statusText: \`Memilih model pembelajaran AI terbaik untuk topik gabungan...\` }
          }));

          const modelPrompt = \`Pilih 1 model pembelajaran yang paling efektif (misalnya: PjBL, PBL, Inkuiri, Discovery, TaRL, dll) untuk Kelas \${className}, Fase \${data?.fase}, Topik gabungan: \\n\${combinedTopics}. Karakteristik Peserta Didik: \${selectedCharacteristic}. Jawablah hanya dengan format: "Nama Model: [Nama Model]"\`;
          
          let modelResponseText = "Tidak ditentukan";
          try {
            const modelRec = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: modelPrompt,
            });
             modelResponseText = modelRec.text || "Tidak ditentukan";
          } catch (e) {
            console.error("Model rec failed, fallback:", e);
          }

          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { ...prev[className], statusText: \`Model dipilih: \${modelResponseText}. Membuat konten modul gabungan...\` }
          }));

          const prompt = \`
## Generator Modul Ajar SD Berbasis Permendikdasmen Nomor 13 Tahun 2025

# PERAN AI
Bertindaklah sebagai Tim Ahli Kurikulum Pendidikan Indonesia, yang terdiri atas:
* Ahli Kurikulum Kemendikdasmen
* Pengembang Modul Ajar
* Pengembang Kurikulum Merdeka
* Pengembang Pembelajaran Mendalam (Deep Learning)
* Pengawas Sekolah
* Asesor Akreditasi Sekolah
* Guru Inti Nasional
* Editor Bahasa Indonesia
* Desainer Dokumen Pendidikan

Anda memiliki pengalaman lebih dari 20 tahun dalam menyusun perangkat ajar SD.
Seluruh jawaban harus menggunakan Bahasa Indonesia baku, profesional, mudah dipahami guru, serta siap digunakan sebagai dokumen resmi sekolah.

# TUJUAN
Anda akan menghasilkan SATU Modul Ajar Lengkap yang mencakup beberapa Alur Tujuan Pembelajaran (ATP) sekaligus dalam satu dokumen modul ajar. 
Dokumen harus siap dicetak tanpa perlu ditambah lagi.

# LANDASAN
Gunakan sebagai dasar penyusunan:
* Permendikdasmen Nomor 13 Tahun 2025
* Capaian Pembelajaran yang berlaku untuk mata pelajaran dan fase yang diminta pengguna
* Prinsip Pembelajaran Mendalam (Deep Learning)
* Delapan Dimensi Profil Lulusan
* Prinsip 8,3,3,4
* Kurikulum yang berlaku

Jangan mengutip atau mengklaim isi regulasi yang tidak diketahui. Bila informasi spesifik belum diberikan pengguna, gunakan placeholder yang diberi tanda [DIISI OLEH GURU].

# PRINSIP PEMBELAJARAN
Pastikan modul menerapkan secara nyata:
## A. 8 Dimensi Profil Lulusan
Jelaskan implementasi setiap dimensi dalam pembelajaran sesuai konteks materi.
## B. 3 Prinsip Pembelajaran
Selalu tampilkan:
1. Mindful Learning
2. Meaningful Learning
3. Joyful Learning
Jelaskan implementasinya pada materi yang sedang dibuat.
## C. 3 Pengalaman Belajar
Selalu menggunakan: Memahami, Mengaplikasi, Merefleksi. Lengkapi aktivitas peserta didik pada setiap bagian.
## D. 4 Kerangka Pembelajaran
Selalu memuat: Praktik Pedagogis, Kemitraan Pembelajaran, Lingkungan Pembelajaran, Pemanfaatan Teknologi Digital. Jelaskan implementasinya secara nyata sesuai materi.

# STRUKTUR MODUL AJAR
Hasilkan dokumen lengkap dengan urutan berikut.

# COVER
Judul Modul
Logo sekolah (placeholder)
Nama Guru: \${userIdentity.authorName}
NIP: [DIISI OLEH GURU]
Sekolah: \${userIdentity.institutionName}
Tahun Pelajaran: 2025/2026
Fase: \${data?.fase}
Kelas: \${className}
Semester: \${semChoice}
Mata Pelajaran: \${data?.subject}

# IDENTITAS MODUL
Nama Guru: \${userIdentity.authorName}
Sekolah: \${userIdentity.institutionName}
Fase: \${data?.fase}
Kelas: \${className}
Semester: \${semChoice}
Mapel: \${data?.subject}
Materi/Topik Gabungan: 
\${combinedTopics}
Alokasi Waktu dan beban jp: \${totalJP} JP
Tanggal Pelaksanaan: \${dateString}
Model Pembelajaran: \${modelResponseText}
Karakteristik Peserta Didik: \${selectedCharacteristic}
Target Peserta Didik
Sarana Prasarana

# CAPAIAN PEMBELAJARAN
\${combinedCPString}

# TUJUAN PEMBELAJARAN
\${combinedTPs}

# ALUR TUJUAN PEMBELAJARAN
berurutan. Logis. Berkesinambungan.

# PEMAHAMAN BERMAKNA
Tuliskan manfaat pembelajaran bagi kehidupan nyata peserta didik sesuai dengan jenjang level kelas siswa

# PERTANYAAN PEMANTIK
Minimal 5 pertanyaan. Mengaktifkan berpikir kritis.

# DIAGNOSTIK
Diagnostik Kognitif & Diagnostik Non-Kognitif (Lengkap beserta instrumennya).

# PEMBELAJARAN MENDALAM (8,3,3,4)
Uraikan implementasi secara kontekstual pada materi yang diajarkan.

# LANGKAH PEMBELAJARAN
Buat sangat rinci. Untuk setiap pertemuan (sesuaikan dengan total JP \${totalJP} JP dan tanggal \${dateString}). Gunakan format tabel. Minimal terdiri atas: Pendahuluan, Kegiatan Inti, Penutup. Cantumkan estimasi waktunya. Pada kegiatan inti, jelaskan aktivitas guru dan peserta didik secara rinci.

# ASESMEN
-Diagnostik, Formatif, Sumatif. Lengkap. Pilih salah satu instrumen asesmen yang paling relevan. Jangan memaksakan penggunaan seluruh jenis asesmen. Setiap asesmen yang dipilih harus memiliki keterkaitan langsung dengan tujuan pembelajaran.

# INSTRUMEN PENILAIAN
-Observasi, Kinerja, Produk, Tes Tertulis, Tes Lisan, Praktik, Portofolio. Lengkap beserta rubrik. Pilih salah satu instrumen penilaian yang paling relevan.

# RUBRIK PENILAIAN
Gunakan skala yang konsisten. Sertakan indikator dan deskripsi tiap tingkat capaian.

# PENGAYAAN & REMEDIAL
Lengkap.

# REFLEKSI GURU & PESERTA DIDIK
Guru: Minimal 10 pertanyaan refleksi. Peserta Didik: Minimal 10 pertanyaan sederhana sesuai usia.

# LKPD
Selalu buat LKPD siap cetak. Memiliki: Judul, Tujuan, Petunjuk, Alat, Langkah Kerja, Tugas, Soal, Ruang Jawaban.

# BAHAN BACAAN
Guru & Peserta Didik

# GLOSARIUM
Semua istilah penting.

# DAFTAR PUSTAKA
Disusun sesuai sumber yang benar-benar digunakan. Jangan mengarang referensi.

# LAMPIRAN
Tambahkan seluruh lampiran berikut bila relevan: Lembar Observasi, Rubrik Sikap, Pengetahuan, Keterampilan, dll.

# FORMAT PENULISAN
Gunakan Heading. Sub Heading. Tabel rapi (HTML). Nomor otomatis. Paragraf Gunakan Justify. Bahasa formal. Spasi konsisten. Siap dipindahkan ke Microsoft Word.

# VALIDASI OTOMATIS
Sebelum menampilkan hasil akhir, lakukan pemeriksaan mandiri dan tampilkan tabel validasi yang memuat:
* Kelengkapan komponen modul
* Kesesuaian dengan data yang diberikan pengguna
* Bagian yang menggunakan placeholder
* Bagian yang perlu disesuaikan sekolah
* Konsistensi tujuan, kegiatan, dan asesmen

OUTPUT FORMAT:
Berikan output dalam format HTML (tanpa tag <html>/<body>, hanya konten div) yang siap di-render di website. Gunakan styling inline CSS minimalis untuk tabel (border-collapse, padding: 5px, border: 1px solid black, width: 100%).
Gunakan tag <h3> untuk judul bagian.
\`;

          let response;
          let retries = 6;
          let success = false;
          let delayMs = 20000;
          
          while (retries > 0 && !success) {
              try {
                  response = await ai.models.generateContent({
                      model: 'gemini-3-flash-preview',
                      contents: prompt,
                  });
                  success = true;
              } catch (e: any) {
                  const errorString = JSON.stringify(e) + (e?.message || String(e)) + (e?.error?.status || '');
                  const isRateLimit = errorString.includes('429') || errorString.toLowerCase().includes('quota') || errorString.toLowerCase().includes('rate limit') || errorString.includes('RESOURCE_EXHAUSTED');
                  if (isRateLimit && retries > 1) {
                      let waitTime = Math.max(delayMs, 60000);
                      console.warn(\`Rate limit hit. Retrying in \${waitTime / 1000}s... (\${retries - 1} retries left)\`);
                      setBulkGenerationStatus(prev => ({
                          ...prev,
                          [className]: { ...prev[className], statusText: \`Mencegah limit server. Jeda pendinginan \${waitTime / 1000} detik... (\${retries - 1} percobaan tersisa)\` }
                      }));
                      await new Promise(res => setTimeout(res, waitTime));
                      delayMs = waitTime + 15000;
                      retries--;
                  } else {
                      throw e;
                  }
              }
          }

          if (!success) {
               throw new Error(\`Gagal memproses setelah percobaan berulang.\`);
          }

          const html = response?.text || "<p>Gagal membuat konten.</p>";
          collectedHtml += html + \`<br><br><div style="page-break-after: always; clear: both;"></div><br><br>\`;
          collectedModulesData.push({ topic: 'Modul Gabungan', html });

          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { 
                  current: maxModules, 
                  total: maxModules, 
                  percent: 100, 
                  active: true,
                  statusText: \`Modul gabungan selesai.\`
              }
          }));
`;

content = content.replace(regex, replacement);

fs.writeFileSync('index.tsx', content);
console.log('Replacement done.');
