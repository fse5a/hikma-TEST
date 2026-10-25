import {sendError, getRequestId, sendJson} from '../_lib/response.js';
import {resolveSupabaseUser} from '../_lib/supabase-auth.js';

export default async function handler(request, response) {
  const requestId = getRequestId(request);
  const user = await resolveSupabaseUser(request, response, requestId);
  if (!user) return;
  const {id} = request.query || {};

  if (!id) {
    return sendError(response, 'missing_job_id', 'A job id is required.', requestId, 400);
  }

  return sendJson(response, 200, {
    ok: true,
    requestId,
    job: {
      id,
      status: 'queued',
      progress: 0,
      message: 'The job system is ready for resumable processing. The demo mode keeps the task lightweight.'
    }
  });
}
