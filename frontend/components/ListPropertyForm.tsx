'use client';

import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { api, getToken, uploadImages, type ApiProperty } from '@/lib/api';

type Props = {
  initial?: ApiProperty | null;
  onClose: () => void;
  onSaved: () => void;
};

function toText(value: string[] | string | undefined, joiner: string): string {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(joiner);
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.join(joiner) : value;
  } catch {
    return value;
  }
}

const PROPERTY_TYPES = ['apartment', 'flat', 'house', 'duplex', 'studio'];

export default function ListPropertyForm({ initial, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [rent, setRent] = useState(initial?.rent != null ? String(initial.rent) : '');
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? 'apartment');
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms != null ? String(initial.bedrooms) : '2');
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms != null ? String(initial.bathrooms) : '1');
  const [area, setArea] = useState(initial?.area != null ? String(initial.area) : '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [amenities, setAmenities] = useState(toText(initial?.amenities, ', '));
  const [images, setImages] = useState(toText(initial?.images, '\n'));
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  function pickFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    if (picked.length === 0) return;
    setFiles(prev => [...prev, ...picked].slice(0, 10));
    e.target.value = '';
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const rentNum = Number(rent);
    if (!title.trim()) { setError('Give your property a title.'); return; }
    if (!rentNum || rentNum <= 0) { setError('Enter a valid annual rent in naira.'); return; }
    if (!city.trim()) { setError('Enter the city.'); return; }

    const token = getToken();
    if (!token) { setError('You are not signed in.'); return; }

    setPending(true);
    setUploadStatus('');
    try {
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        setUploadStatus(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`);
        uploadedUrls = await uploadImages(files, token);
        setUploadStatus('');
      }
      const body = {
        title: title.trim(),
        description: description.trim(),
        rent: rentNum,
        propertyType,
        bedrooms: Math.max(0, Number(bedrooms) || 0),
        bathrooms: Math.max(0, Number(bathrooms) || 0),
        area: area.trim() ? Number(area) : null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: '',
        amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
        images: [...uploadedUrls, ...images.split('\n').map(u => u.trim()).filter(Boolean)],
      };
      if (initial) {
        await api(`/properties/${initial.id}`, { method: 'PUT', body, token });
      } else {
        await api('/properties', { method: 'POST', body, token });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the listing.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <button style={S.close} onClick={onClose} aria-label="Close">&times;</button>
        <h3 style={S.heading}>{initial ? 'Edit listing' : 'List a property'}</h3>
        <p style={S.lead}>{initial ? 'Update the details below.' : 'Fill in the details. Your listing goes live immediately.'}</p>
        <form onSubmit={submit}>
          <label style={S.label}>Title *</label>
          <input style={S.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 3-bed flat in Lekki Phase 1" required />

          <label style={S.label}>Description</label>
          <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Power, water, security, parking, tenancy terms..." />

          <div style={S.grid2}>
            <div>
              <label style={S.label}>Annual rent (₦) *</label>
              <input style={S.input} type="number" min={1} value={rent} onChange={e => setRent(e.target.value)} placeholder="e.g. 2500000" required />
            </div>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.input} value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div style={S.grid3}>
            <div>
              <label style={S.label}>Bedrooms</label>
              <input style={S.input} type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Bathrooms</label>
              <input style={S.input} type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Area (sqm)</label>
              <input style={S.input} type="number" min={0} value={area} onChange={e => setArea(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <label style={S.label}>Street address</label>
          <input style={S.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 12 Admiralty Way" />

          <div style={S.grid2}>
            <div>
              <label style={S.label}>City *</label>
              <input style={S.input} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lagos" required />
            </div>
            <div>
              <label style={S.label}>State</label>
              <input style={S.input} value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Lagos" />
            </div>
          </div>

          <label style={S.label}>Amenities <span style={S.hint}>(comma-separated)</span></label>
          <input style={S.input} value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="Prepaid meter, Borehole, Security, Parking" />

          <label style={S.label}>Photos</label>
          <div style={S.dropzone}>
            <input
              id="listing-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={pickFiles}
              style={S.fileInput}
            />
            <label htmlFor="listing-photos" style={S.dropzoneLabel}>
              <strong>Choose photos</strong>
              <span>Up to 10 images, 5MB each. JPG, PNG, WEBP or GIF.</span>
            </label>
          </div>
          {uploadStatus && <p style={S.uploadStatus}>{uploadStatus}</p>}
          {previews.length > 0 && (
            <div style={S.previewGrid}>
              {previews.map((src, i) => (
                <div key={src} style={S.previewItem}>
                  <img src={src} alt={`Selected photo ${i + 1}`} style={S.previewImg} />
                  <button type="button" onClick={() => removeFile(i)} style={S.previewRemove} aria-label={`Remove photo ${i + 1}`}>&times;</button>
                </div>
              ))}
            </div>
          )}

          <label style={S.label}>Photo URLs <span style={S.hint}>(optional — added after uploaded photos)</span></label>
          <textarea style={{ ...S.input, minHeight: 56, resize: 'vertical' }} value={images} onChange={e => setImages(e.target.value)} placeholder="https://... (leave blank to use a placeholder)" />

          {error && <p style={S.error}>{error}</p>}

          <div style={S.actions}>
            <button type="button" onClick={onClose} style={S.cancel}>Cancel</button>
            <button type="submit" disabled={pending} style={S.submit}>
              {pending ? (uploadStatus ? 'Uploading…' : 'Saving…') : initial ? 'Save changes' : 'Publish listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,38,28,.45)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' },
  modal: { background: '#fff', borderRadius: 16, padding: 26, width: '100%', maxWidth: 560, position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,.2)', margin: 'auto 0' },
  close: { position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' },
  heading: { fontSize: 18, fontWeight: 700, color: '#0f261c', margin: '0 0 4px' },
  lead: { fontSize: 13, color: '#5c6f63', margin: '0 0 18px' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#0f261c', margin: '14px 0 6px' },
  hint: { fontWeight: 400, color: '#8a9a8d' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e9dd', fontSize: 13, color: '#0f261c', background: '#fffefa', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  error: { fontSize: 13, color: '#c62828', background: '#fce4ec', borderRadius: 10, padding: '10px 14px', margin: '14px 0 0' },
  dropzone: { position: 'relative', border: '1.5px dashed #c9d4c4', borderRadius: 12, background: '#f9faf5' },
  fileInput: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
  dropzoneLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '20px 14px', textAlign: 'center', cursor: 'pointer' },
  uploadStatus: { fontSize: 12, color: '#17634a', margin: '8px 0 0' },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8, marginTop: 10 },
  previewItem: { position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#eef1e9' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  previewRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(15,38,28,.72)', color: '#fff', fontSize: 15, lineHeight: 1, cursor: 'pointer' },
  actions: { display: 'flex', gap: 8, marginTop: 22, justifyContent: 'flex-end' },
  cancel: { fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 999, border: '1px solid #e5e9dd', background: '#fff', color: '#5c6f63', cursor: 'pointer' },
  submit: { fontSize: 13, fontWeight: 700, padding: '10px 22px', borderRadius: 999, border: 'none', background: '#17634a', color: '#fff', cursor: 'pointer' },
};
