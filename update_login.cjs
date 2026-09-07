const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');

const loginFormRegex = /<form\s+onSubmit=\{async \(e\) => \{[\s\S]*?className="space-y-5"\s*>/;
code = code.replace(loginFormRegex, `
  <form 
      onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const formData = new FormData(form);
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;
          const name = formData.get('name') as string || email.split('@')[0];
          
          try {
              if (isLogin) {
                  const storedUser = await usersDB.getItem<{password: string, name: string, email: string}>(email);
                  if (storedUser && storedUser.password === password) {
                      const userData = { name: storedUser.name, email };
                      localStorage.setItem('prota_user', JSON.stringify(userData));
                      setUser(userData);
                      setAppStage('generator');
                  } else {
                      alert('Email atau Password salah.');
                  }
              } else {
                  const storedUser = await usersDB.getItem(email);
                  if (storedUser) {
                      alert('Akun dengan email ini sudah ada.');
                  } else {
                      const userData = { password, name, email };
                      await usersDB.setItem(email, userData);
                      localStorage.setItem('prota_user', JSON.stringify({ name, email }));
                      setUser({ name, email });
                      setAppStage('tutorial');
                  }
              }
          } catch(err) {
              console.error(err);
              alert('Terjadi kesalahan saat memproses akun');
          }
      }}
      className="space-y-5"
  >
`);

const emailDivRegex = /<div>\s*<label className="block text-sm font-semibold text-slate-700 mb-1">Email<\/label>\s*<input\s+type="email"\s+name="email"\s+required\s+className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white\/50"\s+placeholder="nama@email.com"\s*\/>\s*<\/div>/;

const replacement = `
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                            placeholder="nama@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Kata Sandi</label>
                        <input 
                            type="password" 
                            name="password"
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                            placeholder="Masukkan kata sandi"
                        />
                    </div>
`;
code = code.replace(emailDivRegex, replacement);

fs.writeFileSync('index.tsx', code);
console.log('Done replacement 3');
