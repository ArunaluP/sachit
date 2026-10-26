import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container page">
      <div className="card">
        <EmptyState icon="🧭">
          <h1>Page not found</h1>
          <p>The page you are looking for does not exist.</p>
          <Link className="btn" to="/">
            Go to home
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}
