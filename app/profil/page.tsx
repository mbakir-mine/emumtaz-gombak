import AppFrame from '../ui/AppFrame';
import ProfileForm from './ProfileForm';

export default function ProfilPage() {
  return (
    <AppFrame title="Kemaskini Profil" subtitle="Maklumat asas pengguna." active="profile">
      <section className="panel profile-edit-panel">
        <div className="panel-head">
          <div>
            <h2>Profil Pengguna</h2>
            <p className="table-note">Kemaskini nama paparan profil anda dalam sistem.</p>
          </div>
        </div>
        <ProfileForm />
      </section>
    </AppFrame>
  );
}
