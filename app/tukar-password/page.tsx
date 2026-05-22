import AppFrame from '../ui/AppFrame';
import ChangePasswordForm from './ChangePasswordForm';

export default function TukarPasswordPage() {
  return (
    <AppFrame title="Tukar Password" subtitle="Kemaskini kata laluan akaun anda." active="dashboard">
      <section className="panel password-panel">
        <div className="panel-head">
          <div>
            <h2>Tukar Password</h2>
            <p className="table-note">Masukkan password semasa dan tetapkan password baru.</p>
          </div>
        </div>
        <ChangePasswordForm />
      </section>
    </AppFrame>
  );
}
