import { useState, useEffect } from 'react'
import { SvgIcon } from './IconSprite'
import { loadTrackers, saveTrackers } from '../lib/storage'
import { supabase } from '../lib/supabase'

export default function TrackerModal({ ctx }) {
  const { setTrackerModalOpen, editingTrackerId, setEditingTrackerId, initialKeyword, setInitialKeyword, toast, user, setShowHome } = ctx

  const [name, setName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [color, setColor] = useState('#b9a9ff')

  const colors = ['#b9a9ff', '#06b6d4', '#34d399', '#fbbf24', '#f43f5e', '#ec4899', '#f97316']
  const isEdit = !!editingTrackerId

  useEffect(() => {
    if (editingTrackerId) {
      const tracker = loadTrackers().find(t => t.id === editingTrackerId)
      if (tracker) {
        setName(tracker.name)
        setKeywords((tracker.keywords || []).join(', '))
        setColor(tracker.color || '#b9a9ff')
      }
    } else {
      setName('')
      setKeywords(initialKeyword || '')
      setColor('#b9a9ff')
    }
  }, [editingTrackerId, initialKeyword])

  const close = () => { setTrackerModalOpen(false); setEditingTrackerId(null); setInitialKeyword('') }

  const save = async () => {
    if (!name.trim()) { toast('Enter a tracker name', 'error'); return }

    const kws = keywords.split(',').map(k => k.trim()).filter(Boolean)
    if (kws.length === 0) { toast('Enter at least one keyword', 'error'); return }
    const trackers = loadTrackers()

    let trackerId
    if (isEdit) {
      const tracker = trackers.find(t => t.id === editingTrackerId)
      if (tracker) {
        tracker.name = name.trim()
        tracker.keywords = kws
        tracker.color = color
        tracker.updatedAt = Date.now()
        trackerId = tracker.id
      }
    } else {
      trackerId = 'trk-' + Date.now().toString(36)
      trackers.push({
        id: trackerId, name: name.trim(), keywords: kws, color,
        createdAt: Date.now(), updatedAt: Date.now(), lastFetched: null
      })
    }
    saveTrackers(trackers)

    try {
      const trackerData = {
        id: trackerId, user_id: user?.id, name: name.trim(),
        keywords: kws, color, updated_at: Date.now()
      }
      if (isEdit) {
        await supabase.from('trackers').upsert(trackerData)
      } else {
        trackerData.created_at = Date.now()
        await supabase.from('trackers').insert(trackerData)
      }
    } catch (e) { console.warn('Tracker sync failed:', e) }

    setShowHome?.(false)
    close()
    toast(isEdit ? 'Tracker updated!' : 'Tracker created!', 'success')
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title"><SvgIcon id="ico-rss" size={20} /> {isEdit ? 'Edit Tracker' : 'New Tracker'}</div>
          <button className="modal-close" onClick={close}><SvgIcon id="ico-x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Tracker Name <span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Regenerative Agriculture, AI Policy" />
          </div>
          <div className="form-group">
            <label className="form-label">Keywords / Topics <span className="required">*</span></label>
            <input className="form-input" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Enter keywords separated by commas" />
            <div className="form-hint">Separate multiple keywords with commas. Each keyword will be searched independently.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {colors.map(c => (
                <button key={c} className="color-swatch" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={save}><SvgIcon id={isEdit ? 'ico-save' : 'ico-rss'} size={16} /> {isEdit ? 'Save Changes' : 'Create Tracker'}</button>
        </div>
      </div>
    </div>
  )
}
