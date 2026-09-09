import { redirect } from 'next/navigation';

/**
 * Canonical entry point for the integrated IHAB module.
 *
 * The original /khalifah-muda route remains available for existing bookmarks
 * and saved links. Keeping the redirect server-side avoids maintaining two
 * independent copies of the module UI and data workflow.
 */
export default function SahsiahIhabPage() {
  redirect('/khalifah-muda');
}
