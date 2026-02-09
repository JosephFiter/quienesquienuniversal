import { useState, useEffect } from 'react';

const STORAGE_KEY = 'customCharacterLists';
const SELECTED_KEY = 'selectedCharacterList';

const Settings = ({ onClose }) => {
    const [lists, setLists] = useState({});
    const [selected, setSelected] = useState(null);
    const [newName, setNewName] = useState('');
    const [newCharactersText, setNewCharactersText] = useState('');
    const [importCode, setImportCode] = useState('');

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            setLists(stored);
            const sel = localStorage.getItem(SELECTED_KEY);
            setSelected(sel);
        } catch (e) {
            setLists({});
        }
    }, []);

    const saveLists = (next) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setLists(next);
    };

    const handleCreate = () => {
        if (!newName) return alert('Poné un nombre para la lista');
        const names = newCharactersText.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
        if (names.length === 0) return alert('Agregá al menos un personaje');
        const arr = names.map((n, i) => ({ id: i + 1, name: n, image: '' }));
        const next = { ...lists, [newName]: arr };
        saveLists(next);
        setNewName('');
        setNewCharactersText('');
    };

    const handleSelect = (name) => {
        localStorage.setItem(SELECTED_KEY, name);
        setSelected(name);
    };

    const handleDelete = (name) => {
        if (!confirm(`Eliminar lista "${name}" ?`)) return;
        const next = { ...lists };
        delete next[name];
        saveLists(next);
        if (selected === name) {
            localStorage.removeItem(SELECTED_KEY);
            setSelected(null);
        }
    };

    const makeExportCode = (name) => {
        const arr = lists[name] || [];
        const code = ':' + arr.map((c) => (c.name || '').replace(/:/g, '').replace(/_/g, ' ')).join('_') + ':';
        return code;
    };

    const copyToClipboard = async (txt) => {
        try {
            await navigator.clipboard.writeText(txt);
            alert('Código copiado al portapapeles');
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = txt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('Código copiado al portapapeles');
        }
    };

    const handleExport = (name) => {
        const code = makeExportCode(name);
        copyToClipboard(code);
    };

    const handleImport = () => {
        const raw = importCode.trim();
        if (!raw) return alert('Pegá un código para importar');
        const trimmed = raw.replace(/^:+|:+$/g, '');
        if (!trimmed) return alert('Código inválido');
        const parts = trimmed.split('_').map((s) => s.trim()).filter(Boolean);
        if (parts.length === 0) return alert('No se encontraron personajes en el código');
        const name = prompt('Nombre para la lista importada') || `Lista ${Date.now()}`;
        const arr = parts.map((n, i) => ({ id: i + 1, name: n, image: '' }));
        const next = { ...lists, [name]: arr };
        saveLists(next);
        setImportCode('');
    };

    return (
        <div className="modal-overlay" style={{position: 'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={onClose}>
            <div className="modal" style={{background:'#fff', padding:20, maxWidth:800, width:'95%'}} onClick={(e)=>e.stopPropagation()}>
                <h3>Configuración de Personajes</h3>
                <button onClick={onClose} style={{float:'right'}}>Cerrar</button>

                <section style={{marginTop:10}}>
                    <h4>Listas existentes</h4>
                    {Object.keys(lists).length === 0 ? <p>No hay listas creadas.</p> : (
                        <ul>
                            {Object.keys(lists).map((name) => (
                                <li key={name} style={{marginBottom:6}}>
                                    <strong>{name}</strong>
                                    <button onClick={() => handleSelect(name)} style={{marginLeft:8}}>{selected===name? 'Seleccionada' : 'Seleccionar'}</button>
                                    <button onClick={() => handleExport(name)} style={{marginLeft:8}}>Compartir</button>
                                    <button onClick={() => handleDelete(name)} style={{marginLeft:8}}>Eliminar</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section style={{marginTop:10}}>
                    <h4>Crear nueva lista</h4>
                    <input placeholder="Nombre de la lista" value={newName} onChange={(e)=>setNewName(e.target.value)} />
                    <div style={{marginTop:6}}>
                        <textarea placeholder="Personajes (separar por coma o nueva línea)" rows={4} style={{width:'100%'}} value={newCharactersText} onChange={(e)=>setNewCharactersText(e.target.value)} />
                    </div>
                    <button onClick={handleCreate} style={{marginTop:6}}>Crear</button>
                </section>

                <section style={{marginTop:10}}>
                    <h4>Importar por código</h4>
                    <input placeholder=":Ana_Beto_Carla:" value={importCode} onChange={(e)=>setImportCode(e.target.value)} style={{width:'60%'}} />
                    <button onClick={handleImport} style={{marginLeft:8}}>Importar</button>
                </section>
            </div>
        </div>
    );
};

export default Settings;
