(async()=>{
const T=window.TR;if(!T)return;const sb=T.sb;const session=(await sb.auth.getSession()).data.session;
if(!session){T.authUI('دخول مدير النظام — Top Rank',false);T.say('يلزم تسجيل دخول المدير');return}
let {data:profile,error:profileErr}=await sb.from('tr_profiles').select('role,active').eq('user_id',session.user.id).single();
if(profileErr||!profile?.active||!['admin','manager','dispatcher','accountant'].includes(profile.role)){T.say('لا توجد صلاحية إدارة لهذا الحساب');const shield=document.createElement('div');shield.id='trAuth';shield.innerHTML='<div class="trbox"><h2>الدخول غير مصرح</h2><p>الحساب الحالي ليس لديه صلاحية الإدارة. تأكد من تفعيل الدور في tr_profiles.</p><button id="trExit">تسجيل الخروج</button></div>';document.body.append(shield);document.getElementById('trExit').onclick=async()=>{await sb.auth.signOut();location.reload()};return}
T.logoutButton();let cities=[];try{cities=await T.getCities()}catch(e){T.say(e.message)}
let ids=new Map();async function refresh(){try{const rows=await T.getBookings();const cm=new Map(cities.map(c=>[c.id,c.name_ar]));ids=new Map(rows.map(r=>[r.booking_no,r.id]));bookings=rows.map(r=>T.toAdmin(r,cm));renderAll();T.say('لوحة الإدارة متصلة — '+rows.length+' حجز')}catch(e){T.say('فشل تحميل الحجوزات: '+e.message)}}
// Replace local demo writes with server-side RPC; disable local-only creation/editing.
window.saveBooking=function(e){e.preventDefault();toast('إنشاء الحجوزات من واجهة العميل فقط')};
window.openBooking=function(){toast('استخدم قائمة الحالة في جدول الحجوزات للتعديل الآمن')};
window.tableRows=function(arr,actions=true){return `<table><thead><tr><th>رقم الحجز</th><th>العميل</th><th>الخدمة</th><th>المدينة</th><th>الموعد</th><th>المبلغ</th><th>الحالة</th>${actions?'<th>تغيير الحالة</th>':''}</tr></thead><tbody>${arr.map(b=>`<tr><td>${esc(b.id)}</td><td>${esc(b.name)}<br><small>${esc(b.phone)}</small></td><td>${esc(b.service)}</td><td>${esc(b.region)} / ${esc(b.city)}</td><td>${esc(b.date)}</td><td>${money(b.price)}</td><td>${esc(b.status)}</td>${actions?`<td><select class="field" onchange="trAdminUpdate('${esc(b.id)}',this.value)">${Object.values(T.statusMap).map(x=>`<option value="${esc(x)}" ${x===b.status?'selected':''}>${esc(x)}</option>`).join('')}</select></td>`:''}</tr>`).join('')||'<tr><td colspan="8">لا توجد حجوزات</td></tr>'}</tbody></table>`};
window.resetDemo=function(){toast('تم تعطيل حذف البيانات في وضع Supabase')};
// Override original status mutation entry points after inspecting existing UI.
window.trAdminUpdate=async function(bookingNo,newStatus){const id=ids.get(bookingNo),status=T.statusReverse[newStatus]||newStatus;if(!id){toast('الحجز غير موجود');return}const {error}=await sb.rpc('tr_staff_update_booking',{p_booking_id:id,p_status:status});if(error){toast('فشل التعديل: '+error.message);return}await refresh();toast('تم تحديث الحالة')};
await refresh();setInterval(refresh,12000);
})();