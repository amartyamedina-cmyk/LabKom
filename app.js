(function(){
'use strict';
/* ---------- util ---------- */
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var pad=function(n){return String(n).padStart(2,'0')};
var ymd=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
var hm=function(m){return pad(Math.floor(m/60))+':'+pad(m%60)};
var toMin=function(t){var p=t.split(':');return (+p[0])*60+(+p[1])};
var addDays=function(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x};
var fmtD=function(s){return new Date(s+'T00:00:00').toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'})};
var fmtDT=function(d){return new Date(d).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})};
var toLocalInput=function(d){return ymd(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};

/* ---------- state ---------- */
var S={user:null,screen:'home',flash:null,sel:{},draft:{},log:[],labels:true,file:null,token:null,
  di:{kat:'mataPraktikum',aksi:'tambah',sel:null},seq:{jdw:4,mdl:3,brk:3,nil:1,ntf:1,tkn:1,prs:1,dat:100}};
var USERS=[
  {id:'AKN-001',ident:'245150400111001',pass:'praktikan123',name:'Tedy Sunella',role:'Mahasiswa'},
  {id:'AKN-010',ident:'245150400111010',pass:'asprak123',name:'Amartya Medina',role:'Mahasiswa'},
  {id:'AKN-020',ident:'197505052001121002',pass:'dosen123',name:'Omar Kareem',role:'Dosen'},
  {id:'AKN-030',ident:'198803102012012001',pass:'lab12345',name:'Hazel Athaderi',role:'Pengelola Lab'}
];
var KINFO={'KLS-001':{mp:'MPK-001',dosen:'AKN-020'},'KLS-002':{mp:'MPK-002',dosen:'AKN-020'}};
var MEM=[{akun:'AKN-001',kelas:'KLS-001',peran:'Praktikan'},{akun:'AKN-001',kelas:'KLS-002',peran:'Asprak'},{akun:'AKN-010',kelas:'KLS-001',peran:'Asprak'},{akun:'AKN-010',kelas:'KLS-002',peran:'Praktikan'}];
function kelasSaya(a){
  if(a.role==='Mahasiswa')return MEM.filter(function(m){return m.akun===a.id}).map(function(m){return {kelas:m.kelas,peran:m.peran}});
  if(a.role==='Dosen')return Object.keys(KINFO).filter(function(k){return KINFO[k].dosen===a.id}).map(function(k){return {kelas:k,peran:'Dosen'}});
  return [];
}
function resetCtx(){S.flash=null;S.sel={};S.tab={};S.draft.usulan=null;S.draft.modul=null;S.draft.perubahan=null}
function enterAs(a,kelas,peran){S.acct=a;S.user=Object.assign({},a,{role:peran,kelas:kelas});S.screen='home';resetCtx()}
function enterAccount(a){
  S.acct=a;
  if(a.role==='Pengelola Lab'){enterAs(a,null,'Pengelola Lab');return}
  var ks=kelasSaya(a);
  if(ks.length===1){enterAs(a,ks[0].kelas,ks[0].peran);return}
  S.user=Object.assign({},a,{kelas:null});S.screen='beranda';resetCtx();
}
var UI={
  login:['UI-01','HalamanLogin','SD-01'],usulan:['UI-02','FormPenjadwalan','SD-02'],persetujuan:['UI-03','HalamanPersetujuanJadwal','SD-02'],
  jadwal:['UI-04','HalamanJadwalSesi','SD-02'],token:['UI-05','FormBuatToken','SD-03'],presensi:['UI-06','FormPresensi','SD-03'],
  vpresensi:['UI-07','HalamanValidasiPresensi','SD-04'],klarifikasi:['UI-08','HalamanKlarifikasi','SD-04'],tugas:['UI-09','HalamanTugas','SD-05'],
  status:['UI-10 + UI-13','HalamanStatusTugas','SD-05'],penilaian:['UI-11','HalamanPenilaian','SD-06'],vnilai:['UI-12','HalamanValidasiNilai','SD-06'],
  nilai:['UI-13','HalamanNilaiTugas','SD-06'],modul:['UI-14','HalamanModulTugas','SD-07'],vmodul:['UI-15','HalamanValidasiModul','SD-07'],
  perubahan:['UI-16','HalamanPerubahanJadwal','SD-08'],beranda:['UI-19','HalamanBerandaKelas','SD-01'],notifikasi:['UI-17','HalamanNotifikasi','SD-08'],datainduk:['UI-18','HalamanDataInduk','SD-09']
};
var NAV={
  'Pengelola Lab':[['persetujuan','Persetujuan Jadwal'],['perubahan','Perubahan Jadwal'],['datainduk','Data Induk']],
  'Asprak':[['usulan','Usulan Jadwal'],['token','Buat Token'],['modul','Modul Tugas'],['penilaian','Penilaian'],['klarifikasi','Klarifikasi'],['notifikasi','Notifikasi']],
  'Praktikan':[['jadwal','Jadwal Sesi'],['presensi','Presensi'],['tugas','Tugas / Modul'],['status','Status Tugas'],['nilai','Nilai Tugas'],['notifikasi','Notifikasi']],
  'Dosen':[['vpresensi','Validasi Presensi'],['vmodul','Validasi Modul'],['vnilai','Validasi Nilai']]
};
/* Menu dan tab sesuai Sketsa UI (2.7): satu menu bisa memuat beberapa tab */
var MENU={
  'Pengelola Lab':[{l:'Persetujuan Jadwal',k:'persetujuan'},{l:'Perubahan Jadwal',k:'perubahan'},{l:'Data Induk',k:'datainduk'}],
  'Asprak':[{l:'Jadwal',tabs:[['usulan','Usulan Jadwal'],['notifikasi','Notifikasi']]},{l:'Presensi',tabs:[['token','Buat Token'],['klarifikasi','Klarifikasi']]},{l:'Modul Tugas',k:'modul'},{l:'Penilaian',k:'penilaian'}],
  'Praktikan':[{l:'Jadwal',tabs:[['jadwal','Jadwal Sesi'],['notifikasi','Notifikasi']]},{l:'Presensi',k:'presensi'},{l:'Tugas Saya',tabs:[['tugas','Kumpul Tugas'],['status','Status & Nilai']]}],
  'Dosen':[{l:'Validasi',tabs:[['vpresensi','Presensi'],['vnilai','Nilai'],['vmodul','Modul']]}]
};
function menuScreens(m){return m.tabs?m.tabs.map(function(t){return t[0]}):[m.k]}
function badgeCount(k){
  var u=S.user,kl=u&&u.kelas;
  if(k==='persetujuan')return S.jadwal.filter(function(j){return j.status==='Menunggu Validasi'}).length;
  if(!kl)return 0;
  if(k==='notifikasi')return unread();
  if(k==='klarifikasi')return RK().filter(function(r){return r.status==='Perlu Klarifikasi'}).length;
  if(k==='vpresensi')return RK().filter(function(r){return r.status==='Menunggu Validasi'}).length;
  if(k==='vnilai')return S.nilai.filter(function(n){return n.status==='Menunggu Validasi Dosen'&&S.modul.filter(function(m){return m.id===getBerkas(n.berkas).modul})[0].kelas===kl}).length;
  if(k==='vmodul')return S.modul.filter(function(m){return m.status==='Menunggu Validasi Dosen'&&m.kelas===kl}).length;
  return 0;
}
var CLASS_SIZE=30;

function seed(){
  var now=new Date(),nm=now.getHours()*60+now.getMinutes(),today=ymd(now);
  S.master={
    pengguna:USERS.map(function(u){return {id:u.id,kode:u.ident,nama:u.name+' ('+u.role+')'}}),
    mataPraktikum:[{id:'MPK-001',kode:'SI2203',nama:'Rekayasa Sistem Informasi'},{id:'MPK-002',kode:'SI2105',nama:'Basis Data'},{id:'MPK-003',kode:'SI2301',nama:'Pemrograman Web'}],
    kelas:[{id:'KLS-001',kode:'SI-B',nama:'SI-B'},{id:'KLS-002',kode:'SI-A',nama:'SI-A'}],
    lab:[{id:'LAB-01',kode:'LAB-01',nama:'Lab Basis Data'},{id:'LAB-02',kode:'LAB-02',nama:'Lab Jaringan'},{id:'LAB-03',kode:'LAB-03',nama:'Lab RPL'}]
  };
  S.jadwal=[
    {id:'JDW-000',mp:'MPK-001',kelas:'KLS-001',lab:'LAB-01',asprak:'AKN-010',tanggal:ymd(addDays(now,-1)),mulai:'13:00',selesai:'15:00',status:'Resmi',alasan:''},
    {id:'JDW-001',mp:'MPK-001',kelas:'KLS-001',lab:'LAB-01',asprak:'AKN-010',tanggal:today,mulai:hm(Math.max(0,nm-30)),selesai:hm(Math.min(1439,nm+90)),status:'Resmi',alasan:''},
    {id:'JDW-002',mp:'MPK-001',kelas:'KLS-001',lab:'LAB-02',asprak:'AKN-010',tanggal:ymd(addDays(now,1)),mulai:'09:00',selesai:'11:00',status:'Resmi',alasan:''},
    {id:'JDW-003',mp:'MPK-001',kelas:'KLS-001',lab:'LAB-03',asprak:'AKN-010',tanggal:ymd(addDays(now,2)),mulai:'13:00',selesai:'15:00',status:'Menunggu Validasi',alasan:''}
  ];
  S.jadwal.push({id:'JDW-901',mp:'MPK-002',kelas:'KLS-002',lab:'LAB-02',asprak:'AKN-001',tanggal:today,mulai:hm(Math.max(0,nm-30)),selesai:hm(Math.min(1439,nm+90)),status:'Resmi',alasan:''},
    {id:'JDW-902',mp:'MPK-002',kelas:'KLS-002',lab:'LAB-02',asprak:'AKN-001',tanggal:ymd(addDays(now,3)),mulai:'14:00',selesai:'16:00',status:'Resmi',alasan:''});
  S.presensi=[];
  S.rekap=[{id:'RKP-901',jadwal:'JDW-901',base:20,status:'Menunggu Validasi',catatan:'',jawaban:''},{id:'RKP-001',jadwal:'JDW-000',base:28,status:'Menunggu Validasi',catatan:'',jawaban:''},{id:'RKP-002',jadwal:'JDW-001',base:26,status:'Menunggu Validasi',catatan:'',jawaban:''}];
  var d1=addDays(now,-1);d1.setHours(23,59,0,0);var d2=addDays(now,5);d2.setHours(23,59,0,0);
  S.modul=[
    {id:'MDL-001',kelas:'KLS-001',materi:'Modul 1: Pengantar Pemodelan Sistem',deadline:d1.getTime(),status:'Terpublikasi',catatan:''},
    {id:'MDL-002',kelas:'KLS-001',materi:'Modul 2: Use Case dan Activity Diagram',deadline:d2.getTime(),status:'Terpublikasi',catatan:''}
  ];
  S.modul.push({id:'MDL-901',kelas:'KLS-002',materi:'Modul 1: Pengantar Basis Data',deadline:addDays(now,4).getTime(),status:'Terpublikasi',catatan:''});
  S.berkas=[
    {id:'BRK-001',modul:'MDL-001',praktikan:'AKN-101',nama:'Modul1_Bima.pdf',size:1240,waktu:addDays(now,-1).getTime(),status:'Terkumpul (terlambat)'},
    {id:'BRK-002',modul:'MDL-001',praktikan:'AKN-102',nama:'Modul1_Sinta.docx',size:860,waktu:addDays(now,-2).getTime(),status:'Terkumpul'}
  ];
  S.praktikanNama={'AKN-001':'Tedy Sunella','AKN-010':'Amartya Medina','AKN-101':'Bima Saputra','AKN-102':'Sinta Maharani'};
  S.nilai=[];S.notif=[];S.token=null;
}
seed();

/* ---------- lookups ---------- */
var M=function(cat,id,f){var x=S.master[cat].filter(function(e){return e.id===id})[0];return x?(f?x[f]:x.nama):id};
var jadwalLabel=function(j){return M('mataPraktikum',j.mp)+' · '+M('kelas',j.kelas)+' · '+fmtD(j.tanggal)+' '+j.mulai+'–'+j.selesai+' · '+M('lab',j.lab)};
var getJ=function(id){return S.jadwal.filter(function(j){return j.id===id})[0]};
var getBerkas=function(id){return S.berkas.filter(function(b){return b.id===id})[0]};
var getNilaiOf=function(bid){return S.nilai.filter(function(n){return n.berkas===bid})[0]};
var pname=function(id){return S.praktikanNama[id]||id};
function overlap(a,b){return toMin(a.mulai)<toMin(b.selesai)&&toMin(b.mulai)<toMin(a.selesai)}
function bentrok(c,ignore,states){return S.jadwal.some(function(j){return j.id!==ignore&&states.indexOf(j.status)>-1&&j.lab===c.lab&&j.tanggal===c.tanggal&&overlap(j,c)})}
function hasilCek(j){return bentrok(j,j.id,['Resmi','Reschedule'])?'bentrok':'tidak bentrok'}
function hadirOf(rk){return rk.base+S.presensi.filter(function(p){return p.jadwal===rk.jadwal}).length}
function sessionRunning(j){var n=new Date();return (j.status==='Resmi'||j.status==='Reschedule')&&j.tanggal===ymd(n)&&toMin(j.mulai)<=n.getHours()*60+n.getMinutes()&&n.getHours()*60+n.getMinutes()<=toMin(j.selesai)}
function visibleNotif(){var u=S.user;return S.notif.filter(function(n){var j=getJ(n.jadwal);return j&&u.kelas&&j.kelas===u.kelas})}
function unread(){return visibleNotif().filter(function(n){return !(n.read||{})[S.user.id]}).length}

/* ---------- ui helpers ---------- */
function tone(s){
  if(/Resmi|Hadir|Tervalidasi|Final|Terpublikasi|^Terkumpul$|Reschedule/.test(s)&&!/terlambat/.test(s))return 'good';
  if(/terlambat|Menunggu|Perlu|Revisi/.test(s))return 'warn';
  if(/Dibatalkan|bentrok$/.test(s)&&s!=='tidak bentrok')return 'bad';
  if(s==='tidak bentrok')return 'good';
  return '';
}
var chip=function(s){return '<span class="chip '+tone(s)+'">'+esc(s)+'</span>'};
function L(sd,title,lines){S.log.unshift({sd:sd,title:title,lines:lines,t:new Date().toLocaleTimeString('id-ID')});if(S.log.length>40)S.log.pop()}
function flash(type,text){S.flash={type:type,text:text,screen:S.screen}}
function flashHtml(){return S.flash&&S.flash.screen===S.screen?'<div class="note '+S.flash.type+'" role="status">'+S.flash.text+'</div>':''}
function head(key,title,desc){var u=UI[key];return '<header class="sh">'+(u?'<div class="tags"><span class="tag">'+u[0]+'</span><span class="tag">'+u[1]+'</span><span class="tag">'+u[2]+'</span></div>':'')+(title===S.hdr?'':'<h1>'+title+'</h1>')+'</header>'+flashHtml()}
function table(cols,rows,rowAttr){
  if(!rows.length)return '';
  return '<div class="tw"><table><thead><tr>'+cols.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r,i){return '<tr'+(rowAttr?rowAttr(i):'')+'>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
}
var opts=function(list,sel,lf){return list.map(function(e){return '<option value="'+esc(e.id)+'"'+(e.id===sel?' selected':'')+'>'+esc(lf?lf(e):e.nama)+'</option>'}).join('')};
var empty=function(t){return '<div class="empty">'+t+'</div>'};
function kb(n){return n>=1024?(n/1024).toFixed(1).replace('.',',')+' MB':n+' KB'}

/* ---------- screens ---------- */
var SCR={};

SCR.home=function(){
  var u=S.user,t=[],go=function(s,txt,c){t.push('<li><span>'+txt+'</span><button class="btn sm" data-act="go" data-id="'+s+'">'+(c||'Buka')+'</button></li>')};
  if(u.role==='Pengelola Lab'){
    var n=S.jadwal.filter(function(j){return j.status==='Menunggu Validasi'}).length;
    if(n)go('persetujuan',n+' usulan jadwal menunggu persetujuan','Periksa');
    go('perubahan','Reschedule atau batalkan jadwal','Buka');
    go('datainduk','Kelola data induk','Buka');
  }
  if(u.role==='Asprak'){
    go('usulan','Ajukan atau revisi usulan jadwal');
    var run=S.jadwal.filter(sessionRunning).length;
    if(run)go('token',run+' sesi sedang berlangsung','Buat token');
    var kl=S.rekap.filter(function(r){return r.status==='Perlu Klarifikasi'}).length;
    if(kl)go('klarifikasi',kl+' permintaan klarifikasi dari dosen','Jawab');
    var pn=S.berkas.filter(function(b){var n=getNilaiOf(b.id);return !n||n.status==='Revisi'}).length;
    if(pn)go('penilaian',pn+' berkas menunggu penilaian','Nilai');
    var rv=S.modul.filter(function(m){return m.status==='Revisi'}).length;
    if(rv)go('modul',rv+' modul dikembalikan dosen untuk revisi','Revisi');
  }
  if(u.role==='Praktikan'){
    go('jadwal','Lihat jadwal sesi resmi kelasmu');
    var run2=S.jadwal.filter(sessionRunning).length;
    if(run2)go('presensi','Sesi sedang berlangsung','Presensi');
    var open=S.modul.filter(function(m){return m.status==='Terpublikasi'&&m.kelas===u.kelas&&!S.berkas.some(function(b){return b.modul===m.id&&b.praktikan===u.id})}).length;
    if(open)go('tugas',open+' modul belum dikumpulkan','Kumpulkan');
  }
  if(u.role==='Dosen'){
    var a=S.rekap.filter(function(r){return r.status==='Menunggu Validasi'}).length,b=S.modul.filter(function(m){return m.status==='Menunggu Validasi Dosen'}).length,c=S.nilai.filter(function(n){return n.status==='Menunggu Validasi Dosen'}).length;
    if(a)go('vpresensi',a+' rekap kehadiran menunggu validasi','Periksa');
    if(b)go('vmodul',b+' modul menunggu validasi','Periksa');
    if(c)go('vnilai',c+' nilai menunggu validasi','Periksa');
    if(!a&&!b&&!c)t.push('<li><span class="muted">Tidak ada yang perlu divalidasi.</span></li>');
  }
  var un=unread();if(un&&u.kelas)go('notifikasi',un+' notifikasi perubahan jadwal baru','Baca');
  return '<header class="sh"><div class="tags"><span class="tag">SD-01</span><span class="tag">Dashboard</span></div><h1>Halo, '+esc(u.name.split(' ')[0])+'</h1></header>'+flashHtml()+
    '<section class="card"><h2>Perlu tindakan</h2><ul class="tasks">'+t.join('')+'</ul></section>';
};

SCR.beranda=function(){
  var a=S.acct,ks=kelasSaya(a);
  var cards=ks.map(function(k){var di=KINFO[k.kelas];
    return '<button type="button" class="kcard" data-act="bukaKelas" data-kelas="'+k.kelas+'" data-peran="'+k.peran+'"><span class="kp '+k.peran.toLowerCase()+'">'+k.peran+'</span><b>'+esc(M('mataPraktikum',di.mp))+'</b><span class="kgo">Buka kelas</span></button>'}).join('');
  return head('beranda','Kelas saya')+'<div class="kgrid">'+(cards||empty('Belum ada kelas.'))+'</div>';
};

SCR.usulan=function(){
  var u=S.user,d=S.draft.usulan,now=new Date();
  if(!d)d=S.draft.usulan={mp:KINFO[u.kelas].mp,kelas:u.kelas,tanggal:ymd(addDays(now,4)),mulai:'09:00',selesai:'11:00',lab:'LAB-01',replace:null};
  var mine=S.jadwal.filter(function(j){return j.asprak===u.id&&j.kelas===u.kelas});
  return head('usulan','Form Usulan Jadwal Sesi','Isi mata praktikum, kelas, waktu, dan ruang. Sistem mengecek bentrok sebelum usulan disimpan.')+
  '<form class="card" data-form="usulan" id="f-usulan">'+
  '<div class="grid2"><label class="f">Mata praktikum<select id="u-mp" name="mp">'+opts(S.master.mataPraktikum,d.mp,function(e){return e.kode+' · '+e.nama})+'</select></label>'+
  '<label class="f">Kelas<select id="u-kelas" name="kelas">'+opts(S.master.kelas.filter(function(k){return k.id===u.kelas}),d.kelas)+'</select></label>'+
  '<label class="f">Tanggal<input type="date" id="u-tgl" name="tanggal" value="'+d.tanggal+'"></label>'+
  '<label class="f">Ruang (laboratorium)<select id="u-lab" name="lab">'+opts(S.master.lab,d.lab)+'</select></label>'+
  '<label class="f">Jam mulai<input type="time" id="u-mulai" name="mulai" value="'+d.mulai+'"></label>'+
  '<label class="f">Jam selesai<input type="time" id="u-selesai" name="selesai" value="'+d.selesai+'"></label></div>'+
  '<div class="row"><button class="btn pri" type="submit" id="u-ajukan">Ajukan</button></div></form>'+
  '<section class="card"><h2>Usulan saya</h2>'+(mine.length?table(['ID','Jadwal','Status','Catatan',''],mine.map(function(j){return [j.id,esc(jadwalLabel(j)),chip(j.status),esc(j.alasan||'-'),j.status==='Revisi'?'<button class="btn sm" data-act="revisiUsulan" data-id="'+j.id+'">Revisi</button>':'']})):empty('Belum ada usulan.'))+'</section>';
};

SCR.persetujuan=function(){
  var list=S.jadwal.filter(function(j){return j.status==='Menunggu Validasi'}),sel=S.sel.persetujuan,j=sel&&getJ(sel);
  if(j&&j.status!=='Menunggu Validasi')j=null;
  var tbl=list.length?table(['ID','Mata praktikum','Kelas','Tanggal & jam','Ruang','Pengaju','Hasil cek',''],list.map(function(x){return [x.id,esc(M('mataPraktikum',x.mp)),esc(M('kelas',x.kelas)),esc(fmtD(x.tanggal)+' '+x.mulai+'–'+x.selesai),esc(M('lab',x.lab)),esc(pname(x.asprak)),chip(hasilCek(x)),'<button class="btn sm" data-act="detailUsulan" data-id="'+x.id+'">Detail</button>']},function(i){return list[i].id===sel?' class="sel"':''})):empty('Tidak ada usulan menunggu.');
  var det=j?'<section class="card"><h2>Detail usulan '+j.id+'</h2><dl class="kv"><dt>Mata praktikum</dt><dd>'+esc(M('mataPraktikum',j.mp))+'</dd><dt>Kelas</dt><dd>'+esc(M('kelas',j.kelas))+'</dd><dt>Waktu</dt><dd>'+esc(fmtD(j.tanggal)+', '+j.mulai+'–'+j.selesai)+'</dd><dt>Ruang</dt><dd>'+esc(M('lab',j.lab))+'</dd><dt>Hasil cek otomatis</dt><dd>'+chip(hasilCek(j))+'</dd></dl>'+
    '<label class="f">Alasan penolakan<textarea id="p-alasan"></textarea></label><div class="row"><button class="btn pri" data-act="setujuiJadwal" data-id="'+j.id+'">Setujui</button><button class="btn bad" data-act="tolakJadwal" data-id="'+j.id+'">Tolak</button></div></section>':'';
  return head('persetujuan','Persetujuan Jadwal','Periksa usulan jadwal beserta hasil pengecekan otomatis, lalu setujui atau tolak.')+'<section class="card"><h2>Usulan menunggu validasi</h2>'+tbl+'</section>'+det;
};

SCR.jadwal=function(){
  var u=S.user,k=S.sel.jkelas||u.kelas;
  var list=S.jadwal.filter(function(j){return j.kelas===k&&j.status!=='Menunggu Validasi'&&j.status!=='Revisi'}).sort(function(a,b){return (a.tanggal+a.mulai)<(b.tanggal+b.mulai)?-1:1});
  return head('jadwal','Jadwal Sesi Lab','Jadwal resmi sesi praktikum untuk kelas yang dipilih.')+
  '<section class="card"><label class="f" style="max-width:260px">Kelas<select id="j-kelas" data-change="jkelas">'+opts(S.master.kelas,k)+'</select></label>'+
  (list.length?table(['Hari & tanggal','Waktu','Mata praktikum','Lokasi lab','Keterangan'],list.map(function(j){return [esc(fmtD(j.tanggal)),j.mulai+'–'+j.selesai,esc(M('mataPraktikum',j.mp)),esc(M('lab',j.lab)),j.status==='Resmi'?chip('Resmi'):j.status==='Reschedule'?'<span class="chip warn">Dijadwal ulang</span>':chip(j.status)]})):empty('Belum ada jadwal resmi.'))+'</section>';
};

SCR.token=function(){
  var u=S.user,mine=S.jadwal.filter(function(j){return j.asprak===u.id&&j.kelas===u.kelas&&(j.status==='Resmi'||j.status==='Reschedule')});
  var sel=S.sel.token||(mine.filter(sessionRunning)[0]||mine[0]||{}).id;
  var tk=S.token&&S.token.jadwal===sel?S.token:null;
  return head('token','Pembuatan Token Presensi','Token hanya bisa dibuat untuk sesi yang sedang berlangsung. Tunjukkan kode ke praktikan di kelas.')+
  '<section class="card"><label class="f">Sesi<select id="t-sesi" data-change="tsesi">'+opts(mine,sel,function(j){return jadwalLabel(j)+(sessionRunning(j)?' (sedang berlangsung)':'')})+'</select></label>'+
  '<div class="row"><button class="btn pri" id="t-buat" data-act="buatToken"'+(mine.length?'':' disabled')+'>Buat Token</button></div></section>'+
  (tk?'<section class="card"><h2>Kode token</h2><div class="token" id="t-kode">'+esc(tk.kode)+'</div><p>Berlaku sampai <b>'+new Date(tk.exp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+'</b> · sisa <span id="cd" class="cd">…</span></p></section>':'');
};

SCR.presensi=function(){
  var u=S.user,mine=S.presensi.filter(function(p){return p.praktikan===u.id&&getJ(p.jadwal).kelas===u.kelas});
  return head('presensi','Presensi Praktikan','Masukkan kode token dari asprak untuk mencatat kehadiranmu di sesi yang berjalan.')+
  '<form class="card" data-form="presensi" id="f-presensi"><label class="f" style="max-width:320px">Kode token<input type="text" id="pr-kode" name="kode" autocomplete="off" class="mono" maxlength="8"></label><div class="row"><button class="btn pri" type="submit" id="pr-kirim">Kirim</button></div></form>'+
  '<section class="card"><h2>Riwayat presensi saya</h2>'+(mine.length?table(['Sesi','Waktu hadir','Status'],mine.map(function(p){return [esc(jadwalLabel(getJ(p.jadwal))),esc(fmtDT(p.waktu)),chip('Hadir')]})):empty('Belum ada presensi tercatat.'))+'</section>';
};

var RK=function(){return S.rekap.filter(function(r){return getJ(r.jadwal).kelas===S.user.kelas})};
SCR.vpresensi=function(){
  var sel=S.sel.vpresensi,rk=S.rekap.filter(function(r){return r.id===sel})[0];
  var tbl=table(['Sesi','Hadir','Tidak hadir','Status',''],RK().map(function(r){var h=hadirOf(r);return [esc(jadwalLabel(getJ(r.jadwal))),h+' / '+CLASS_SIZE,(CLASS_SIZE-h)+'',chip(r.status),'<button class="btn sm" data-act="periksaRekap" data-id="'+r.id+'">Periksa</button>']},function(i){return RK()[i].id===sel?' class="sel"':''}));
  var det='';
  if(rk){var h=hadirOf(rk),mine=S.presensi.filter(function(p){return p.jadwal===rk.jadwal});
    det='<section class="card"><h2>Rincian rekap '+rk.id+'</h2><dl class="kv"><dt>Sesi</dt><dd>'+esc(jadwalLabel(getJ(rk.jadwal)))+'</dd><dt>Kehadiran</dt><dd><div class="bar"><i style="width:'+Math.round(h/CLASS_SIZE*100)+'%"></i></div>'+h+' dari '+CLASS_SIZE+' praktikan hadir</dd><dt>Tercatat via token</dt><dd>'+(mine.length?mine.map(function(p){return esc(pname(p.praktikan))+' ('+new Date(p.waktu).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+')'}).join(', ')+(rk.base?' dan '+rk.base+' praktikan lain':''):rk.base+' praktikan')+'</dd>'+(rk.catatan?'<dt>Catatan dosen</dt><dd>'+esc(rk.catatan)+'</dd>':'')+(rk.jawaban?'<dt>Jawaban asprak</dt><dd>'+esc(rk.jawaban)+'</dd>':'')+'<dt>Status</dt><dd>'+chip(rk.status)+'</dd></dl>'+
      (rk.status==='Tervalidasi'?'<div class="note good">Rekap sudah terkunci sebagai data kehadiran resmi.</div>':'<label class="f">Catatan klarifikasi<textarea id="v-catatan"></textarea></label><div class="row"><button class="btn pri" data-act="setujuiRekap" data-id="'+rk.id+'">Setujui</button><button class="btn" data-act="mintaKlarifikasi" data-id="'+rk.id+'">Minta Klarifikasi</button></div>')+'</section>';}
  return head('vpresensi','Validasi Presensi','Periksa rekap kehadiran per sesi, lalu setujui atau minta klarifikasi ke asprak.')+'<section class="card"><h2>Rekap per sesi</h2>'+tbl+'</section>'+det;
};

SCR.klarifikasi=function(){
  var list=RK().filter(function(r){return r.status==='Perlu Klarifikasi'});
  return head('klarifikasi','Klarifikasi Rekap','Jawab permintaan klarifikasi dari dosen. Setelah dikirim, dosen memeriksa ulang rekap.')+
  (list.length?list.map(function(r){return '<form class="card" data-form="klarifikasi" data-id="'+r.id+'"><h2>'+r.id+' · '+esc(jadwalLabel(getJ(r.jadwal)))+'</h2><div class="note warn"><b>Catatan dosen:</b> '+esc(r.catatan)+'</div><label class="f">Jawaban klarifikasi<textarea name="jawaban" id="k-jawab-'+r.id+'"></textarea></label><div class="row"><button class="btn pri" type="submit">Kirim</button></div></form>'}).join(''):'<div class="card">'+empty('Belum ada permintaan klarifikasi.')+'</div>');
};

SCR.tugas=function(){
  var u=S.user,mods=S.modul.filter(function(m){return m.status==='Terpublikasi'&&m.kelas===u.kelas});
  var sel=S.sel.tugas||(mods[0]||{}).id,now=Date.now();
  var f=S.file;
  return head('tugas','Tugas / Modul','Pilih modul yang terpublikasi lalu unggah berkasnya. Berkas yang lewat deadline tetap diterima dengan keterangan terlambat.')+
  '<section class="card"><h2>Modul terpublikasi</h2>'+(mods.length?table(['Modul','Deadline','Status pengumpulan'],mods.map(function(m){var b=S.berkas.filter(function(x){return x.modul===m.id&&x.praktikan===u.id})[0];return [esc(m.materi),esc(fmtDT(m.deadline))+(m.deadline<now?' <span class="chip bad">lewat</span>':''),b?chip(b.status):'<span class="chip">Belum dikumpulkan</span>']})):empty('Belum ada modul terpublikasi.'))+'</section>'+
  '<form class="card" data-form="tugas" id="f-tugas"><h2>Unggah berkas</h2><label class="f">Modul<select id="tg-modul" name="modul" data-change="tmodul">'+opts(mods,sel,function(m){return m.materi})+'</select></label>'+
  '<label class="f">Berkas (pdf, docx, zip · maks. 10 MB)<input type="file" id="tg-file" name="file"></label>'+
  '<div id="fileinfo" class="muted">'+(f?'Berkas dipilih: <b>'+esc(f.name)+'</b> ('+kb(f.size)+')':'Belum ada berkas dipilih.')+'</div>'+
  '<div class="row"><button class="btn pri" type="submit" id="tg-unggah"'+(mods.length?'':' disabled')+'>Unggah</button></div></form>';
};

SCR.status=function(){
  var u=S.user,mods=S.modul.filter(function(m){return m.status==='Terpublikasi'&&m.kelas===u.kelas});
  return head('status','Status & Nilai Tugas','Pantau status pengumpulan, nilai, dan feedback semua tugasmu. Nilai tampil setelah dosen memvalidasinya.')+
  '<section class="card">'+(mods.length?table(['Modul','Deadline','Waktu kumpul','Status','Nilai','Feedback','Status nilai'],mods.map(function(m){var b=S.berkas.filter(function(x){return x.modul===m.id&&x.praktikan===u.id})[0],n=b&&getNilaiOf(b.id),fin=n&&n.status==='Final';return [esc(m.materi),esc(fmtDT(m.deadline)),b?esc(fmtDT(b.waktu)):'-',b?chip(b.status):'<span class="chip">Belum dikumpulkan</span>',fin?'<b>'+n.nilai+'</b>':'-',fin?esc(n.feedback||'-'):'-',fin?chip('Final'):n?chip('Menunggu Validasi'):'<span class="chip">Belum dinilai</span>']})):empty('Belum ada tugas.'))+'</section>';
};

SCR.penilaian=function(){
  var sel=S.sel.penilaian,rows=S.berkas.filter(function(b){var n=getNilaiOf(b.id);return (!n||n.status==='Revisi')&&S.modul.filter(function(m){return m.id===b.modul})[0].kelas===S.user.kelas});
  var tbl=rows.length?table(['Praktikan','Modul','Berkas','Waktu kumpul','Status',''],rows.map(function(b){var n=getNilaiOf(b.id);return [esc(pname(b.praktikan)),esc(S.modul.filter(function(m){return m.id===b.modul})[0].materi),'<span class="mono">'+esc(b.nama)+'</span>',esc(fmtDT(b.waktu)),chip(b.status)+(n?' '+chip('Revisi'):''),'<button class="btn sm" data-act="periksaBerkas" data-id="'+b.id+'">Periksa</button>']},function(i){return rows[i].id===sel?' class="sel"':''})):empty('Tidak ada berkas yang perlu dinilai.');
  var b=sel&&getBerkas(sel),det='';
  if(b){var n=getNilaiOf(b.id);det='<form class="card" data-form="nilai" data-id="'+b.id+'"><h2>Periksa dan nilai</h2><dl class="kv"><dt>Praktikan</dt><dd>'+esc(pname(b.praktikan))+'</dd><dt>Berkas</dt><dd><span class="mono">'+esc(b.nama)+'</span> · '+kb(b.size)+'</dd><dt>Status</dt><dd>'+chip(b.status)+'</dd></dl>'+
    (n&&n.catatan?'<div class="note warn"><b>Dikembalikan dosen:</b> '+esc(n.catatan)+'</div>':'')+
    '<div class="grid2"><label class="f">Nilai (0 sampai 100)<input type="number" id="n-nilai" name="nilai" min="0" max="100" step="0.5" value="'+(n?n.nilai:'')+'"></label></div><label class="f">Feedback<textarea id="n-fb" name="feedback">'+(n?esc(n.feedback):'')+'</textarea></label><div class="row"><button class="btn pri" type="submit">Ajukan ke Dosen</button></div></form>';}
  return head('penilaian','Penilaian Tugas','Periksa berkas yang terkumpul, beri nilai dan feedback, lalu ajukan ke dosen untuk divalidasi.')+'<section class="card"><h2>Berkas terkumpul</h2>'+tbl+'</section>'+det;
};

SCR.vnilai=function(){
  var sel=S.sel.vnilai,rows=S.nilai.filter(function(n){return n.status==='Menunggu Validasi Dosen'&&S.modul.filter(function(m){return m.id===getBerkas(n.berkas).modul})[0].kelas===S.user.kelas});
  var tbl=rows.length?table(['Praktikan','Berkas','Nilai',''],rows.map(function(n){var b=getBerkas(n.berkas);return [esc(pname(b.praktikan)),'<span class="mono">'+esc(b.nama)+'</span>',n.nilai,'<button class="btn sm" data-act="periksaNilai" data-id="'+n.id+'">Periksa</button>']},function(i){return rows[i].id===sel?' class="sel"':''})):empty('Belum ada nilai menunggu validasi.');
  var n=sel&&S.nilai.filter(function(x){return x.id===sel})[0],det='';
  if(n&&n.status==='Menunggu Validasi Dosen'){var b=getBerkas(n.berkas);det='<section class="card"><h2>Periksa kewajaran nilai</h2><dl class="kv"><dt>Praktikan</dt><dd>'+esc(pname(b.praktikan))+'</dd><dt>Berkas</dt><dd><span class="mono">'+esc(b.nama)+'</span> '+chip(b.status)+'</dd><dt>Nilai</dt><dd><b>'+n.nilai+'</b></dd><dt>Feedback asprak</dt><dd>'+esc(n.feedback||'-')+'</dd></dl><label class="f">Catatan<textarea id="vn-catatan"></textarea></label><div class="row"><button class="btn pri" data-act="setujuiNilai" data-id="'+n.id+'">Setujui</button><button class="btn bad" data-act="tolakNilai" data-id="'+n.id+'">Tolak</button></div></section>';}
  return head('vnilai','Validasi Nilai','Periksa nilai dan feedback yang diajukan asprak, lalu setujui atau kembalikan untuk revisi.')+'<section class="card"><h2>Nilai diajukan</h2>'+tbl+'</section>'+det;
};

SCR.nilai=function(){
  var u=S.user,mine=S.berkas.filter(function(b){return b.praktikan===u.id&&S.modul.filter(function(m){return m.id===b.modul})[0].kelas===u.kelas});
  return head('nilai','Nilai Tugas','Nilai dan feedback tampil setelah dosen memvalidasinya.')+
  '<section class="card">'+(mine.length?table(['Modul','Berkas','Nilai','Feedback','Status'],mine.map(function(b){var n=getNilaiOf(b.id),fin=n&&n.status==='Final';return [esc(S.modul.filter(function(m){return m.id===b.modul})[0].materi),'<span class="mono">'+esc(b.nama)+'</span>',fin?'<b>'+n.nilai+'</b>':'-',fin?esc(n.feedback||'-'):'-',fin?chip('Final'):n?chip('Menunggu Validasi'):'<span class="chip">Belum dinilai</span>']})):empty('Belum ada tugas yang dikumpulkan.'))+'</section>';
};

SCR.modul=function(){
  var u=S.user,d=S.draft.modul;
  if(!d){var dl=addDays(new Date(),7);dl.setHours(23,59,0,0);d=S.draft.modul={materi:'',deadline:toLocalInput(dl),replace:null};}
  var mine=S.modul.filter(function(m){return m.kelas===u.kelas});
  return head('modul','Modul Tugas','Susun modul beserta deadline lalu ajukan ke dosen. Modul tampil ke praktikan setelah disetujui.')+
  '<form class="card" data-form="modul" id="f-modul">'+'<label class="f">Materi modul<textarea id="m-materi" name="materi">'+esc(d.materi)+'</textarea></label><label class="f" style="max-width:300px">Deadline<input type="datetime-local" id="m-dl" name="deadline" value="'+d.deadline+'"></label><div class="row"><button class="btn pri" type="submit">Ajukan ke Dosen</button></div></form>'+
  '<section class="card"><h2>Modul kelas '+esc(M('kelas',u.kelas))+'</h2>'+table(['ID','Materi','Deadline','Status','Catatan dosen',''],mine.map(function(m){return [m.id,esc(m.materi),esc(fmtDT(m.deadline)),chip(m.status),esc(m.catatan||'-'),m.status==='Revisi'?'<button class="btn sm" data-act="revisiModul" data-id="'+m.id+'">Revisi</button>':'']}))+'</section>';
};

SCR.vmodul=function(){
  var sel=S.sel.vmodul,rows=S.modul.filter(function(m){return m.status==='Menunggu Validasi Dosen'&&m.kelas===S.user.kelas});
  var tbl=rows.length?table(['ID','Materi','Deadline',''],rows.map(function(m){return [m.id,esc(m.materi),esc(fmtDT(m.deadline)),'<button class="btn sm" data-act="periksaModul" data-id="'+m.id+'">Periksa</button>']},function(i){return rows[i].id===sel?' class="sel"':''})):empty('Belum ada modul menunggu validasi.');
  var m=sel&&S.modul.filter(function(x){return x.id===sel})[0],det='';
  if(m&&m.status==='Menunggu Validasi Dosen')det='<section class="card"><h2>Detail modul '+m.id+'</h2><dl class="kv"><dt>Kelas</dt><dd>'+esc(M('kelas',m.kelas))+'</dd><dt>Materi</dt><dd>'+esc(m.materi)+'</dd><dt>Deadline</dt><dd>'+esc(fmtDT(m.deadline))+'</dd></dl><label class="f">Catatan revisi<textarea id="vm-catatan"></textarea></label><div class="row"><button class="btn pri" data-act="setujuiModul" data-id="'+m.id+'">Setujui</button><button class="btn" data-act="mintaRevisi" data-id="'+m.id+'">Minta Revisi</button></div></section>';
  return head('vmodul','Validasi Modul','Periksa modul dan deadline dari asprak, lalu setujui agar terpublikasi atau minta revisi.')+'<section class="card"><h2>Modul diajukan</h2>'+tbl+'</section>'+det;
};

SCR.perubahan=function(){
  var d=S.draft.perubahan,cands=S.jadwal.filter(function(j){return j.status==='Resmi'||j.status==='Reschedule'});
  if(!d)d=S.draft.perubahan={id:(cands[2]||cands[0]||{}).id,aksi:'reschedule',tanggal:ymd(addDays(new Date(),6)),mulai:'10:00',selesai:'12:00'};
  var rs=d.aksi==='reschedule';
  return head('perubahan','Perubahan Jadwal','Reschedule atau batalkan sesi yang sudah resmi. Notifikasi otomatis dikirim ke praktikan dan asprak kelas terkait.')+
  '<form class="card" data-form="perubahan" id="f-perubahan"><label class="f">Jadwal sesi<select id="pj-id" name="id">'+opts(cands,d.id,jadwalLabel)+'</select></label>'+
  '<div class="radios" role="radiogroup" aria-label="Aksi"><label><input type="radio" name="aksi" value="reschedule" data-change="aksiJ"'+(rs?' checked':'')+'> Reschedule</label><label><input type="radio" name="aksi" value="batal" data-change="aksiJ"'+(!rs?' checked':'')+'> Batalkan</label></div>'+
  (rs?'<div class="grid3"><label class="f">Tanggal baru<input type="date" id="pj-tgl" name="tanggal" value="'+d.tanggal+'"></label><label class="f">Jam mulai<input type="time" id="pj-mulai" name="mulai" value="'+d.mulai+'"></label><label class="f">Jam selesai<input type="time" id="pj-selesai" name="selesai" value="'+d.selesai+'"></label></div>':'')+
  '<div class="row"><button class="btn pri" type="submit" id="pj-simpan">Simpan</button></div></form>'+
  '<section class="card"><h2>Notifikasi terkirim</h2>'+(S.notif.length?table(['Waktu','Sesi','Perubahan','Status'],S.notif.map(function(n){return [esc(fmtDT(n.waktu)),esc(n.jadwal),esc(n.lama)+(n.baru?' → '+esc(n.baru):''),chip(n.status)]})):empty('Belum ada notifikasi terkirim.'))+'</section>';
};

SCR.notifikasi=function(){
  var u=S.user,list=visibleNotif(),sel=S.sel.notifikasi,n=sel&&list.filter(function(x){return x.id===sel})[0];
  var tbl=list.length?table(['Waktu','Pesan','',''],list.map(function(x){var un=!(x.read||{})[u.id];return [esc(fmtDT(x.waktu)),(un?'<b>':'')+(x.status==='Dibatalkan'?'Sesi dibatalkan: ':'Jadwal sesi berubah: ')+esc(M('mataPraktikum',getJ(x.jadwal).mp))+(un?'</b>':''),un?'<span class="badge">baru</span>':'','<button class="btn sm" data-act="bukaNotif" data-id="'+x.id+'">Buka</button>']},function(i){return list[i].id===sel?' class="sel"':''})):empty('Belum ada notifikasi.');
  var det=n?'<section class="card"><h2>Detail perubahan</h2><dl class="kv"><dt>Mata praktikum</dt><dd>'+esc(M('mataPraktikum',getJ(n.jadwal).mp))+'</dd><dt>Jadwal lama</dt><dd>'+esc(n.lama)+'</dd><dt>Jadwal baru</dt><dd>'+(n.baru?esc(n.baru):'<span class="chip bad">Dibatalkan, tanpa jadwal pengganti</span>')+'</dd></dl></section>':'';
  return head('notifikasi','Notifikasi','Perubahan jadwal sesi yang berlaku untuk kelasmu (praktikan dan asprak).')+'<section class="card"><h2>Notifikasi masuk</h2>'+tbl+'</section>'+det;
};

var KAT={pengguna:'Pengguna',mataPraktikum:'Mata praktikum',kelas:'Kelas',lab:'Laboratorium'};
SCR.datainduk=function(){
  var d=S.di,rows=S.master[d.kat],sel=d.sel&&rows.filter(function(r){return r.id===d.sel})[0];
  return head('datainduk','Data Induk Laboratorium','Tambah, ubah, atau hapus data induk. Sistem memvalidasi kelengkapan dan menolak data duplikat.')+
  '<section class="card"><label class="f" style="max-width:260px">Kategori<select id="di-kat" data-change="kat">'+Object.keys(KAT).map(function(k){return '<option value="'+k+'"'+(k===d.kat?' selected':'')+'>'+KAT[k]+'</option>'}).join('')+'</select></label>'+
  table(['Kode','Nama',''],rows.map(function(r){return [esc(r.kode),esc(r.nama),'<button class="btn sm" data-act="pilihData" data-id="'+r.id+'">Pilih</button>']},function(i){return rows[i].id===d.sel?' class="sel"':''}))+'</section>'+
  '<form class="card" data-form="datainduk" id="f-di"><div class="radios" role="radiogroup" aria-label="Aksi"><label><input type="radio" name="aksi" value="tambah" data-change="aksiD"'+(d.aksi==='tambah'?' checked':'')+'> Tambah</label><label><input type="radio" name="aksi" value="ubah" data-change="aksiD"'+(d.aksi==='ubah'?' checked':'')+'> Ubah</label><label><input type="radio" name="aksi" value="hapus" data-change="aksiD"'+(d.aksi==='hapus'?' checked':'')+'> Hapus</label></div>'+
  
  '<div class="grid2"><label class="f">Kode<input type="text" id="di-kode" name="kode" value="'+esc(d.aksi==='tambah'?'':sel?sel.kode:'')+'"></label><label class="f">Nama<input type="text" id="di-nama" name="nama" value="'+esc(d.aksi==='tambah'?'':sel?sel.nama:'')+'"></label></div><div class="row"><button class="btn pri" type="submit" id="di-simpan">Simpan</button></div></form>';
};

/* ---------- login & shell ---------- */
function renderLogin(){
  var d=S.draft.login||{ident:'',pass:'',err:''};
  return '<div class="lg-page"><div class="lg-logo"><img src="logo-text.png" alt="LabKom"></div><section class="lg-card"><h1>Sistem Autentikasi UB</h1>'+
  (d.err?'<div class="note bad" role="alert">'+esc(d.err)+'</div>':'')+
  '<form data-form="login" id="f-login"><label for="l-ident">NIM/NIP</label><input type="text" id="l-ident" name="ident" value="'+esc(d.ident)+'" autocomplete="username"><label for="l-pass">Kata Sandi</label><input type="password" id="l-pass" name="pass" value="'+esc(d.pass)+'" autocomplete="current-password"><button type="submit" id="l-masuk">Masuk</button></form></section></div>';
}

function renderShell(){
  var u=S.user,menus=((u.kelas||u.role==='Pengelola Lab')?MENU[u.role]||[]:[]);
  S.tab=S.tab||{};
  var title='Beranda',curMenu=null;
  if(S.screen==='beranda')title='Kelas saya';
  menus.forEach(function(m){if(menuScreens(m).indexOf(S.screen)>-1){curMenu=m;title=m.l;S.tab[m.l]=S.screen}});
  var nav=menus.map(function(m){
    var scr=menuScreens(m),cnt=scr.reduce(function(t,k){return t+badgeCount(k)},0),dest=(S.tab[m.l]&&scr.indexOf(S.tab[m.l])>-1)?S.tab[m.l]:scr[0];
    return '<button data-act="go" data-id="'+dest+'"'+(curMenu===m?' aria-current="page"':'')+'><span>'+m.l+'</span>'+(cnt?'<span class="badge">'+cnt+'</span>':'')+'</button>';
  }).join('');
  var tabs=(curMenu&&curMenu.tabs)?'<div class="tabs" role="tablist" aria-label="'+esc(curMenu.l)+'">'+curMenu.tabs.map(function(t){var c=badgeCount(t[0]);return '<button type="button" role="tab" data-act="go" data-id="'+t[0]+'" aria-selected="'+(S.screen===t[0])+'"><span>'+t[1]+'</span>'+(c?'<span class="badge">'+c+'</span>':'')+'</button>'}).join('')+'</div>':'';
  S.hdr=title;
  var body=(SCR[S.screen]||SCR.home)();
  var logs=S.log.slice(0,8).map(function(b){return '<div class="lb"><b>'+b.sd+' · '+esc(b.title)+'</b> <span class="muted">'+b.t+'</span><div>'+esc(b.lines.join('\n'))+'</div></div>'}).join('')||'<p class="muted">Belum ada pesan.</p>';
  var logo='<img class="bw-i" src="logo-icon.png" alt="">';
  var icUser='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.2 19a7 7 0 0 1 11.6 0"/></svg>';
  var icOut='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>';
  return '<div class="app"><aside class="sb"><div class="bw">'+logo+'<div class="bw-s" role="img" aria-label="LabKom"><img src="logo-lab.png" alt=""><img src="logo-kom.png" alt=""></div></div><nav class="side" aria-label="Menu">'+
  (S.acct.role!=='Pengelola Lab'?'<button data-act="go" data-id="beranda"'+(S.screen==='beranda'?' aria-current="page"':'')+'><span>Semua kelas</span><span class="ui">UI-19</span></button>':'')+nav+'</nav></aside>'+
  '<div class="stage"><header class="hd"><h1 class="pt">'+esc(title)+'</h1><span class="pill">'+icUser+esc(u.name)+'</span><button class="pill" data-act="logout" type="button">'+icOut+'Keluar</button></header>'+
  '<main class="'+(S.screen==='home'?'':'hh1')+'">'+tabs+body+'</main></div></div>';
}

function render(){
  var ae=document.activeElement&&document.activeElement.id;
  document.getElementById('app').innerHTML=S.user?renderShell():renderLogin();
  document.body.classList.toggle('hide-tags',!S.labels);
  if(ae){var el=document.getElementById(ae);if(el&&el.focus)try{el.focus()}catch(e){}}
}
function go(s){S.screen=s;S.flash=null;render();window.scrollTo(0,0)}

/* ---------- actions ---------- */
var A={
  go:function(el){go(el.dataset.id)},
  bukaKelas:function(el){enterAs(S.acct,el.dataset.kelas,el.dataset.peran);L('SD-01','bukaKelas',['3    Pengguna Sistem → HalamanBerandaKelas: bukaKelas(idKelas)','3.1  HalamanBerandaKelas → KontrolLogin: tentukanPeranDiKelas(idAkun, idKelas)','     ⇠ Peran di kelas = '+el.dataset.peran+', menu dan data mengikuti peran']);render()},
  logout:function(){S.acct=null;S.user=null;S.screen='home';S.flash=null;S.draft={};S.sel={};render()},
  isiAkun:function(el){var u=USERS.filter(function(x){return x.id===el.dataset.id})[0];S.draft.login={ident:u.ident,pass:u.pass,err:''};render();var b=document.getElementById('l-masuk');if(b)b.focus()},
  revisiUsulan:function(el){var j=getJ(el.dataset.id);S.draft.usulan={mp:j.mp,kelas:j.kelas,tanggal:j.tanggal,mulai:j.mulai,selesai:j.selesai,lab:j.lab,replace:j.id};render()},
  detailUsulan:function(el){S.sel.persetujuan=el.dataset.id;L('SD-02','periksaDetailUsulan',['4  Pengelola Laboratorium → HalamanPersetujuanJadwal: periksaDetailUsulan(idJadwal)','   ⇠ Detail usulan jadwal']);render()},
  setujuiJadwal:function(el){var j=getJ(el.dataset.id);if(hasilCek(j)==='bentrok'){flash('bad','Usulan bentrok dengan jadwal resmi lain. Tolak dengan alasan.');render();return}
    j.status='Resmi';L('SD-02','tekanSetujui',['5    Pengelola Laboratorium → HalamanPersetujuanJadwal: tekanSetujui('+j.id+')','5.1  HalamanPersetujuanJadwal → KontrolJadwal: setujuiJadwal(idJadwal)','5.1.1 KontrolJadwal → JadwalSesi: kunciDanPublikasi(idJadwal, status = "Resmi")','     ⇠ Slot ruang-waktu terkunci, jadwal terpublikasi']);
    S.sel.persetujuan=null;flash('good','Jadwal '+j.id+' disetujui dan terpublikasi.');render()},
  tolakJadwal:function(el){var j=getJ(el.dataset.id),a=($('#p-alasan')||{}).value||'';if(!a.trim()){flash('bad','Isi alasan penolakan terlebih dahulu.');render();return}
    j.status='Revisi';j.alasan=a.trim();L('SD-02','tekanTolak',['6    Pengelola Laboratorium → HalamanPersetujuanJadwal: tekanTolak('+j.id+', alasan)','6.1  HalamanPersetujuanJadwal → KontrolJadwal: tolakJadwal(idJadwal, alasan)','6.1.1 KontrolJadwal → JadwalSesi: updateStatus(idJadwal, status = "Revisi", alasan)','     ⇠ Status usulan diperbarui']);
    S.sel.persetujuan=null;flash('warn','Usulan '+j.id+' dikembalikan ke asprak.');render()},
  buatToken:function(){
    var id=($('#t-sesi')||{}).value,j=getJ(id);S.sel.token=id;
    var lines=['2    Asprak → FormBuatToken: tekanBuatToken(idJadwal)','2.1  FormBuatToken → KontrolPresensi: buatToken(idJadwal)','2.1.1 KontrolPresensi → JadwalSesi: cekKesesuaianSesi(idJadwal, waktuSekarang)'];
    if(j&&sessionRunning(j)){
      var ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',k='';for(var i=0;i<6;i++)k+=ch[Math.floor(Math.random()*ch.length)];
      S.token={id:'TKN-'+pad(S.seq.tkn++),jadwal:id,kode:k,exp:Date.now()+15*60000};
      lines.push('     ⇠ hasilCek = sesuai','[sesi sesuai] 2.1.2 KontrolPresensi → TokenPresensi: generateToken(idJadwal, masaBerlaku)','[sesi sesuai] 2.1.3 KontrolPresensi → FormBuatToken: tampilkanToken(kodeToken, masaBerlaku)');
      flash('good','Token berhasil dibuat.');
    }else{
      lines.push('     ⇠ hasilCek = belum sesuai','[belum sesuai] 2.1.4 KontrolPresensi → FormBuatToken: tampilkanPesanKesalahan()');
      flash('bad','Token ditolak: sesi belum atau sudah tidak berlangsung.');
    }
    L('SD-03','buatToken',lines);render()},
  periksaRekap:function(el){S.sel.vpresensi=el.dataset.id;L('SD-04','periksaRekap',['2  Dosen → HalamanValidasiPresensi: periksaRekap(idRekap)','   ⇠ Rincian rekap kehadiran']);render()},
  setujuiRekap:function(el){var r=S.rekap.filter(function(x){return x.id===el.dataset.id})[0];r.status='Tervalidasi';
    L('SD-04','tekanSetujui',['3    Dosen → HalamanValidasiPresensi: tekanSetujui(idRekap)','3.1  HalamanValidasiPresensi → KontrolValidasiPresensi: setujuiRekap(idRekap)','3.1.1 KontrolValidasiPresensi → RekapPresensi: kunciRekap(idRekap, status = "Tervalidasi")','     ⇠ Rekap terkunci sebagai data kehadiran resmi']);flash('good','Rekap '+r.id+' tervalidasi.');render()},
  mintaKlarifikasi:function(el){var r=S.rekap.filter(function(x){return x.id===el.dataset.id})[0],c=($('#v-catatan')||{}).value||'';if(!c.trim()){flash('bad','Isi catatan klarifikasi terlebih dahulu.');render();return}
    r.status='Perlu Klarifikasi';r.catatan=c.trim();
    L('SD-04','tekanMintaKlarifikasi',['4      Dosen → HalamanValidasiPresensi: tekanMintaKlarifikasi(idRekap, catatan)','4.1    HalamanValidasiPresensi → KontrolValidasiPresensi: mintaKlarifikasi(idRekap, catatan)','4.1.1  KontrolValidasiPresensi → RekapPresensi: simpanCatatanKlarifikasi(idRekap, catatan)','4.1.2  KontrolValidasiPresensi → HalamanKlarifikasi: teruskanCatatan(idRekap, catatan)','       ⇠ Konfirmasi klarifikasi terkirim']);flash('good','Klarifikasi terkirim ke asprak.');render()},
  periksaBerkas:function(el){S.sel.penilaian=el.dataset.id;L('SD-06','periksaBerkas',['2  Asprak → HalamanPenilaian: periksaBerkas(idBerkas)','   ⇠ Isi berkas tugas']);render()},
  periksaNilai:function(el){S.sel.vnilai=el.dataset.id;L('SD-06','periksaKewajaranNilai',['6  Dosen → HalamanValidasiNilai: periksaKewajaranNilai(idNilai)','   ⇠ Nilai dan feedback yang diajukan']);render()},
  setujuiNilai:function(el){var n=S.nilai.filter(function(x){return x.id===el.dataset.id})[0];n.status='Final';
    L('SD-06','tekanSetujui',['7    Dosen → HalamanValidasiNilai: tekanSetujui(idNilai)','7.1  HalamanValidasiNilai → KontrolPenilaian: setujuiNilai(idNilai)','7.1.1 KontrolPenilaian → Nilai: updateStatus(idNilai, status = "Final")','     ⇠ Nilai final tersimpan']);S.sel.vnilai=null;flash('good','Nilai disetujui (final).');render()},
  tolakNilai:function(el){var n=S.nilai.filter(function(x){return x.id===el.dataset.id})[0],c=($('#vn-catatan')||{}).value||'';if(!c.trim()){flash('bad','Isi catatan penolakan terlebih dahulu.');render();return}
    n.status='Revisi';n.catatan=c.trim();L('SD-06','tolakNilai',['8    Dosen → HalamanValidasiNilai: tolakNilai(idNilai, catatan)','8.1  HalamanValidasiNilai → KontrolPenilaian: tolakNilai(idNilai, catatan)','8.1.1 KontrolPenilaian → Nilai: updateStatus(idNilai, status = "Revisi", catatan)','     ⇠ Nilai dikembalikan ke asprak untuk revisi']);S.sel.vnilai=null;flash('warn','Nilai dikembalikan ke asprak.');render()},
  revisiModul:function(el){var m=S.modul.filter(function(x){return x.id===el.dataset.id})[0];S.draft.modul={materi:m.materi,deadline:toLocalInput(new Date(m.deadline)),replace:m.id};render()},
  periksaModul:function(el){S.sel.vmodul=el.dataset.id;L('SD-07','periksaModul',['5  Dosen → HalamanValidasiModul: periksaModul(idModul)','   ⇠ Detail modul dan deadline']);render()},
  setujuiModul:function(el){var m=S.modul.filter(function(x){return x.id===el.dataset.id})[0];m.status='Terpublikasi';m.catatan='';
    L('SD-07','tekanSetujui',['6    Dosen → HalamanValidasiModul: tekanSetujui(idModul)','6.1  HalamanValidasiModul → KontrolModul: setujuiModul(idModul)','6.1.1 KontrolModul → ModulTugas: updateStatus(idModul, status = "Terpublikasi")','     ⇠ Modul dan deadline terpublikasi ke praktikan']);S.sel.vmodul=null;flash('good','Modul '+m.id+' terpublikasi.');render()},
  mintaRevisi:function(el){var m=S.modul.filter(function(x){return x.id===el.dataset.id})[0],c=($('#vm-catatan')||{}).value||'';if(!c.trim()){flash('bad','Isi catatan revisi terlebih dahulu.');render();return}
    m.status='Revisi';m.catatan=c.trim();L('SD-07','tekanMintaRevisi',['7    Dosen → HalamanValidasiModul: tekanMintaRevisi(idModul, catatan)','7.1  HalamanValidasiModul → KontrolModul: mintaRevisi(idModul, catatan)','7.1.1 KontrolModul → ModulTugas: updateStatus(idModul, status = "Revisi", catatan)','     ⇠ Modul dikembalikan ke asprak']);S.sel.vmodul=null;flash('warn','Modul dikembalikan ke asprak.');render()},
  bukaNotif:function(el){var n=S.notif.filter(function(x){return x.id===el.dataset.id})[0];n.read=n.read||{};n.read[S.user.id]=true;S.sel.notifikasi=n.id;
    L('SD-08','bukaNotifikasi',['2    Mahasiswa → HalamanNotifikasi: bukaNotifikasi(idNotifikasi)','2.1  HalamanNotifikasi → KontrolNotifikasi: getDetailPerubahan(idNotifikasi)','2.1.1 KontrolNotifikasi → Notifikasi: getNotifikasi(idNotifikasi)','     ⇠ Detail perubahan (jadwal lama dan baru) / status "Dibatalkan"']);render()},
  pilihData:function(el){S.di.sel=el.dataset.id;if(S.di.aksi==='tambah')S.di.aksi='ubah';render()}
};

/* ---------- form submit ---------- */
var F={
  login:function(fd){
    var ident=(fd.get('ident')||'').trim(),pass=fd.get('pass')||'';
    var u=USERS.filter(function(x){return x.ident===ident&&x.pass===pass})[0];
    var lines=['2    Pengguna Sistem → HalamanLogin: isiKredensialDanMasuk(identitas, kataSandi)','2.1  HalamanLogin → KontrolLogin: login(identitas, kataSandi)','2.1.1 KontrolLogin → Akun: validasiKredensial(identitas, kataSandi)'];
    if(u){lines.push('     ⇠ hasilValidasi = valid, peran = '+u.role,'[valid] 2.1.2 KontrolLogin → HalamanLogin: tampilkanDaftarKelas(idAkun)');S.draft={};enterAccount(u);L('SD-01','login',lines);}
    else{lines.push('     ⇠ hasilValidasi = tidak valid','[tidak valid] 2.1.3 KontrolLogin → HalamanLogin: tampilkanPesanGagal()');S.draft.login={ident:ident,pass:'',err:'Identitas atau kata sandi salah. Periksa lalu coba lagi.'};L('SD-01','login',lines);}
    render()},
  usulan:function(fd){
    var u=S.user,d={mp:fd.get('mp'),kelas:fd.get('kelas'),tanggal:fd.get('tanggal'),mulai:fd.get('mulai'),selesai:fd.get('selesai'),lab:fd.get('lab'),replace:(S.draft.usulan||{}).replace};S.draft.usulan=d;
    if(!d.tanggal||!d.mulai||!d.selesai){flash('bad','Lengkapi tanggal dan jam terlebih dahulu.');render();return}
    if(toMin(d.selesai)<=toMin(d.mulai)){flash('bad','Jam selesai harus setelah jam mulai.');render();return}
    var lines=['2    Asprak → FormPenjadwalan: isiFormDanAjukan(mataPraktikum, tanggal, jam, ruang, kelas)','2.1  FormPenjadwalan → KontrolJadwal: ajukanJadwal(...)','2.1.1 KontrolJadwal → JadwalSesi: cekBentrok(ruang, tanggal, jam)'];
    var chk={lab:d.lab,tanggal:d.tanggal,mulai:d.mulai,selesai:d.selesai};
    if(bentrok(chk,d.replace,['Resmi','Reschedule','Menunggu Validasi'])){
      lines.push('     ⇠ hasilCek = bentrok','[bentrok] 2.1.2 KontrolJadwal → FormPenjadwalan: tampilkanPeringatanBentrok(pesan)');L('SD-02','ajukanJadwal',lines);
      flash('bad','Bentrok: '+esc(M('lab',d.lab))+' sudah dipakai pada '+esc(fmtD(d.tanggal))+' di jam tersebut.');render();return}
    var id;
    if(d.replace){var j=getJ(d.replace);j.mp=d.mp;j.kelas=d.kelas;j.tanggal=d.tanggal;j.mulai=d.mulai;j.selesai=d.selesai;j.lab=d.lab;j.status='Menunggu Validasi';j.alasan='';id=j.id}
    else{id='JDW-'+pad(S.seq.jdw++).padStart(3,'0');S.jadwal.push({id:id,mp:d.mp,kelas:d.kelas,lab:d.lab,asprak:u.id,tanggal:d.tanggal,mulai:d.mulai,selesai:d.selesai,status:'Menunggu Validasi',alasan:''})}
    lines.push('     ⇠ hasilCek = tidak bentrok','[tidak bentrok] 2.1.3 KontrolJadwal → JadwalSesi: simpanUsulan(dataUsulan, status = "Menunggu Validasi")','[tidak bentrok] 2.1.4 KontrolJadwal → FormPenjadwalan: tampilkanKonfirmasi()');L('SD-02','ajukanJadwal',lines);
    S.draft.usulan=null;flash('good','Usulan '+id+' berhasil diajukan.');render()},
  presensi:function(fd){
    var u=S.user,kode=(fd.get('kode')||'').trim().toUpperCase();
    var lines=['4    Praktikan → FormPresensi: inputKodeToken(kodeToken)','4.1  FormPresensi → KontrolPresensi: catatPresensi(kodeToken, idPraktikan)','4.1.1 KontrolPresensi → TokenPresensi: validasiToken(kodeToken, idPraktikan, waktu)'];
    var tk=S.token&&S.token.kode===kode&&S.token.exp>Date.now()?S.token:null;
    var dup=tk&&S.presensi.some(function(p){return p.praktikan===u.id&&p.jadwal===tk.jadwal});
    if(tk&&!dup){S.presensi.push({id:'PRS-'+pad(S.seq.prs++),praktikan:u.id,jadwal:tk.jadwal,waktu:Date.now()});
      lines.push('     ⇠ hasilValidasi = valid, idJadwal','[valid] 4.1.2 KontrolPresensi → Presensi: simpanKehadiran(idPraktikan, idJadwal, waktu, status = "Hadir")','[valid] 4.1.3 KontrolPresensi → FormPresensi: tampilkanKonfirmasi()');L('SD-03','catatPresensi',lines);flash('good','Presensi berhasil. Kehadiranmu tercatat.');}
    else{lines.push('     ⇠ hasilValidasi = tidak valid','[tidak valid] 4.1.4 KontrolPresensi → FormPresensi: tampilkanPesanGagal()');L('SD-03','catatPresensi',lines);
      flash('bad',dup?'Presensi gagal: kamu sudah presensi di sesi ini.':'Presensi gagal: kode tidak valid atau kedaluwarsa.');}
    render()},
  klarifikasi:function(fd,form){
    var r=S.rekap.filter(function(x){return x.id===form.dataset.id})[0],j=(fd.get('jawaban')||'').trim();
    if(!j){flash('bad','Isi jawaban klarifikasi terlebih dahulu.');render();return}
    r.jawaban=j;r.status='Menunggu Validasi';
    L('SD-04','kirimKlarifikasi',['5    Asprak → HalamanKlarifikasi: kirimKlarifikasi(idRekap, jawaban)','5.1  HalamanKlarifikasi → KontrolValidasiPresensi: simpanKlarifikasi(idRekap, jawaban)','5.1.1 KontrolValidasiPresensi → RekapPresensi: simpanJawabanKlarifikasi(idRekap, jawaban)','     ⇠ Jawaban tersimpan; dosen memeriksa ulang dari pesan 2']);
    flash('good','Jawaban terkirim ke dosen.');render()},
  tugas:function(fd){
    var u=S.user,mid=fd.get('modul'),m=S.modul.filter(function(x){return x.id===mid})[0],f=S.file;
    if(!m||!f){flash('bad','Pilih modul dan berkas terlebih dahulu.');render();return}
    var ext=(f.name.split('.').pop()||'').toLowerCase(),ok=['pdf','docx','zip'].indexOf(ext)>-1&&f.size<=10240;
    var lines=['2    Praktikan → HalamanTugas: pilihTugasDanUnggah(idModul, berkas)','2.1  HalamanTugas → KontrolPengumpulan: kumpulkanBerkas(idModul, idPraktikan, berkas)','2.1.1 KontrolPengumpulan → ModulTugas: getDeadline(idModul)','2.1.2 KontrolPengumpulan → KontrolPengumpulan: validasiBerkas(berkas, waktuKumpul, deadline)'];
    if(!ok){lines.push('     ⇠ hasilValidasi = tidak valid','2.1.5 KontrolPengumpulan → HalamanTugas: tampilkanPesanKesalahan()');L('SD-05','kumpulkanBerkas',lines);
      flash('bad','Unggahan ditolak: format harus pdf, docx, atau zip dan maksimal 10 MB.');render();return}
    var late=Date.now()>m.deadline,st=late?'Terkumpul (terlambat)':'Terkumpul';
    var ex=S.berkas.filter(function(b){return b.modul===mid&&b.praktikan===u.id})[0];
    if(ex){ex.nama=f.name;ex.size=f.size;ex.waktu=Date.now();ex.status=st;var n=getNilaiOf(ex.id);if(n)S.nilai=S.nilai.filter(function(x){return x!==n})}
    else{S.berkas.push({id:'BRK-'+pad(S.seq.brk++).padStart(3,'0'),modul:mid,praktikan:u.id,nama:f.name,size:f.size,waktu:Date.now(),status:st})}
    lines.push('     ⇠ hasilValidasi = valid, statusWaktu = '+(late?'terlambat':'tepat waktu'),'[valid] 2.1.3 KontrolPengumpulan → BerkasTugas: simpanBerkas(..., status = "'+st+'")','[valid] 2.1.4 KontrolPengumpulan → HalamanTugas: tampilkanKonfirmasi(statusWaktu)');L('SD-05','kumpulkanBerkas',lines);
    S.file=null;flash(late?'warn':'good',late?'Berkas diterima dengan keterangan <b>terlambat</b>.':'Berkas berhasil dikumpulkan.');render()},
  nilai:function(fd,form){
    var b=getBerkas(form.dataset.id),v=parseFloat(fd.get('nilai')),fb=(fd.get('feedback')||'').trim();
    if(isNaN(v)||v<0||v>100){flash('bad','Nilai harus berupa angka 0 sampai 100.');render();return}
    var n=getNilaiOf(b.id);if(n){n.nilai=v;n.feedback=fb;n.status='Menunggu Validasi Dosen';n.catatan=''}
    else S.nilai.push({id:'NIL-'+pad(S.seq.nil++).padStart(3,'0'),berkas:b.id,nilai:v,feedback:fb,status:'Menunggu Validasi Dosen',catatan:''});
    L('SD-06','tekanAjukanKeDosen',['3    Asprak → HalamanPenilaian: inputNilaiFeedback(idBerkas, nilai, feedback)','4    Asprak → HalamanPenilaian: tekanAjukanKeDosen()','4.1  HalamanPenilaian → KontrolPenilaian: ajukanNilai(idBerkas, nilai, feedback)','4.1.1 KontrolPenilaian → Nilai: simpanNilai(..., status = "Menunggu Validasi Dosen")','     ⇠ Konfirmasi nilai diajukan']);
    S.sel.penilaian=null;flash('good','Nilai untuk '+esc(pname(b.praktikan))+' diajukan ke dosen.');render()},
  modul:function(fd){
    var u=S.user,materi=(fd.get('materi')||'').trim(),dl=fd.get('deadline'),rep=(S.draft.modul||{}).replace;S.draft.modul={materi:materi,deadline:dl,replace:rep};
    if(!materi||!dl){flash('bad','Isi materi dan deadline terlebih dahulu.');render();return}
    var t=new Date(dl).getTime();if(t<=Date.now()){flash('bad','Deadline harus di masa depan.');render();return}
    var id;if(rep){var m=S.modul.filter(function(x){return x.id===rep})[0];m.materi=materi;m.deadline=t;m.status='Menunggu Validasi Dosen';m.catatan='';id=m.id}
    else{id='MDL-'+pad(S.seq.mdl++).padStart(3,'0');S.modul.push({id:id,kelas:u.kelas,materi:materi,deadline:t,status:'Menunggu Validasi Dosen',catatan:''})}
    L('SD-07','tekanAjukanKeDosen',['2    Asprak → HalamanModulTugas: susunModul(materi, deadline)','3    Asprak → HalamanModulTugas: tekanAjukanKeDosen()','3.1  HalamanModulTugas → KontrolModul: ajukanModul(idKelas, materi, deadline)','3.1.1 KontrolModul → ModulTugas: simpanModul(..., status = "Menunggu Validasi Dosen")','     ⇠ Konfirmasi modul diajukan']);
    S.draft.modul=null;flash('good','Modul '+id+' diajukan ke dosen.');render()},
  perubahan:function(fd){
    var d={id:fd.get('id'),aksi:fd.get('aksi'),tanggal:fd.get('tanggal')||S.draft.perubahan.tanggal,mulai:fd.get('mulai')||S.draft.perubahan.mulai,selesai:fd.get('selesai')||S.draft.perubahan.selesai};S.draft.perubahan=d;
    var j=getJ(d.id);if(!j){flash('bad','Pilih jadwal terlebih dahulu.');render();return}
    var lama=fmtD(j.tanggal)+', '+j.mulai+'–'+j.selesai+', '+M('lab',j.lab),baru='';
    if(d.aksi==='reschedule'){
      if(toMin(d.selesai)<=toMin(d.mulai)){flash('bad','Jam selesai harus setelah jam mulai.');render();return}
      if(bentrok({lab:j.lab,tanggal:d.tanggal,mulai:d.mulai,selesai:d.selesai},j.id,['Resmi','Reschedule'])){flash('bad','Jadwal baru bentrok dengan sesi lain.');render();return}
      j.tanggal=d.tanggal;j.mulai=d.mulai;j.selesai=d.selesai;j.status='Reschedule';baru=fmtD(j.tanggal)+', '+j.mulai+'–'+j.selesai+', '+M('lab',j.lab);
    }else{j.status='Dibatalkan'}
    var nid='NTF-'+pad(S.seq.ntf++).padStart(3,'0');S.notif.unshift({id:nid,jadwal:j.id,lama:lama,baru:baru,status:d.aksi==='reschedule'?'Reschedule':'Dibatalkan',waktu:Date.now(),read:{}});
    L('SD-08','tekanRescheduleAtauBatal',['1    Pengelola Laboratorium → HalamanPerubahanJadwal: tekanRescheduleAtauBatal(idJadwal, jadwalBaru, aksi)','1.1  HalamanPerubahanJadwal → KontrolNotifikasi: ubahJadwal(idJadwal, jadwalBaru, aksi)','1.1.1 KontrolNotifikasi → JadwalSesi: updateJadwal(idJadwal, jadwalBaru, status)','1.1.2 KontrolNotifikasi → Notifikasi: buatNotifikasi(idJadwal, jadwalLama, jadwalBaru, status)','1.1.3 KontrolNotifikasi → HalamanNotifikasi: kirimNotifikasi(idNotifikasi)','     ⇠ Notifikasi masuk ke Mahasiswa pada sesi terkait']);
    S.draft.perubahan=null;flash('good','Perubahan tersimpan, notifikasi '+nid+' terkirim.');render()},
  datainduk:function(fd){
    var d=S.di,rows=S.master[d.kat],kode=(fd.get('kode')||'').trim(),nama=(fd.get('nama')||'').trim(),sel=d.sel&&rows.filter(function(r){return r.id===d.sel})[0];
    var lines=['3    Pengelola Laboratorium → HalamanDataInduk: ubahDataDanSimpan(kategori, aksi, data)','3.1  HalamanDataInduk → KontrolDataInduk: simpanDataInduk(kategori, aksi, data)','3.1.1 KontrolDataInduk → DataInduk: validasiData(kategori, data)'];
    var bad=null;
    if(d.aksi!=='tambah'&&!sel)bad='Pilih data pada tabel terlebih dahulu.';
    else if(d.aksi!=='hapus'&&(!kode||!nama))bad='Kode dan nama wajib diisi.';
    else if(d.aksi!=='hapus'&&rows.some(function(r){return r.kode.toLowerCase()===kode.toLowerCase()&&(!sel||r.id!==sel.id||d.aksi==='tambah')}))bad='Data duplikat: kode "'+esc(kode)+'" sudah dipakai.';
    if(bad){lines.push('     ⇠ hasilValidasi = tidak valid atau duplikat','[tidak valid] 3.1.4 KontrolDataInduk → HalamanDataInduk: tampilkanPesanKesalahan()');L('SD-09','simpanDataInduk',lines);flash('bad',bad);render();return}
    if(d.aksi==='tambah')rows.push({id:'DAT-'+(S.seq.dat++),kode:kode,nama:nama});
    else if(d.aksi==='ubah'){sel.kode=kode;sel.nama=nama}
    else S.master[d.kat]=rows.filter(function(r){return r.id!==sel.id});
    d.sel=null;
    lines.push('     ⇠ hasilValidasi = valid','[valid] 3.1.2 KontrolDataInduk → DataInduk: simpanData(kategori, aksi, data)','[valid] 3.1.3 KontrolDataInduk → HalamanDataInduk: tampilkanKonfirmasi()');L('SD-09','simpanDataInduk',lines);
    flash('good','Data berhasil '+(d.aksi==='tambah'?'ditambahkan':d.aksi==='ubah'?'diubah':'dihapus')+'.');render()}
};

/* ---------- events ---------- */
document.addEventListener('click',function(e){var el=e.target.closest('[data-act]');if(el&&A[el.dataset.act]){e.preventDefault();A[el.dataset.act](el)}});
document.addEventListener('submit',function(e){var f=e.target.closest('[data-form]');if(f&&F[f.dataset.form]){e.preventDefault();F[f.dataset.form](new FormData(f),f)}});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='tg-file'){var fl=t.files&&t.files[0];S.file=fl?{name:fl.name,size:Math.round(fl.size/1024)}:null;var o=$('#fileinfo');if(o)o.innerHTML=S.file?'Berkas dipilih: <b>'+esc(S.file.name)+'</b> ('+kb(S.file.size)+')':'Belum ada berkas dipilih.';return}
  var c=t.dataset&&t.dataset.change;if(!c)return;
  if(c==='tgtag'){S.labels=t.checked;render()}
  else if(c==='jkelas'){S.sel.jkelas=t.value;render()}
  else if(c==='tsesi'){S.sel.token=t.value;render()}
  else if(c==='tmodul'){S.sel.tugas=t.value;render()}
  else if(c==='kat'){S.di={kat:t.value,aksi:'tambah',sel:null};render()}
  else if(c==='aksiD'){S.di.aksi=t.value;if(t.value==='tambah')S.di.sel=null;render()}
  else if(c==='aksiJ'){var d=S.draft.perubahan||{};var sj=$('#pj-id');d.id=sj?sj.value:d.id;d.aksi=t.value;S.draft.perubahan=d;render()}
});
setInterval(function(){var el=document.getElementById('cd');if(!el||!S.token)return;var r=S.token.exp-Date.now();if(r<=0){el.textContent='kedaluwarsa';el.classList.add('expired')}else{el.textContent=pad(Math.floor(r/60000))+':'+pad(Math.floor(r%60000/1000));el.classList.remove('expired')}},1000);
render();
})();