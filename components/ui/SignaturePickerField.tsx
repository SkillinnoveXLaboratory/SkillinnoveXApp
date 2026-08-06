import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { PickedImage } from '@/components/ui/ImagePickerField';
import { colors, radii } from '@/constants/theme';

interface SignaturePickerFieldProps {
  value?: PickedImage;
  onChange: (value?: PickedImage) => void;
  maxBytes: number;
}

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected signature image.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });

const readAssetAsDataUrl = async (asset: ImagePicker.ImagePickerAsset) => {
  const webAsset = asset as ImagePicker.ImagePickerAsset & { file?: File };
  if (Platform.OS === 'web') {
    if (webAsset.file) {
      return readBlobAsDataUrl(webAsset.file);
    }
    const response = await fetch(asset.uri);
    return readBlobAsDataUrl(await response.blob());
  }
  const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:${asset.mimeType || 'image/jpeg'};base64,${base64}`;
};

export function SignaturePickerField({ value, onChange, maxBytes }: SignaturePickerFieldProps) {
  const [editorSource, setEditorSource] = useState('');

  const choose = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > maxBytes) {
      Alert.alert('Image too large', 'Please select a signature image no larger than 5MB.');
      return;
    }
    setEditorSource(await readAssetAsDataUrl(asset));
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as { type: string; dataUrl?: string };
    if (message.type === 'cancel') {
      setEditorSource('');
      return;
    }
    if (message.type !== 'save' || !message.dataUrl) return;
    const base64 = message.dataUrl.split(',')[1] || '';
    const fileSize = Math.ceil(base64.length * 0.75);

    if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
      onChange({ uri: message.dataUrl, dataUrl: message.dataUrl, name: 'signature.png', mimeType: 'image/png', fileSize });
      setEditorSource('');
      return;
    }

    const uri = `${FileSystem.documentDirectory}signature-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    onChange({ uri, name: 'signature.png', mimeType: 'image/png', fileSize });
    setEditorSource('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Digital signature</Text>
      <Pressable onPress={choose} style={styles.picker}>
        {value ? <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="contain" /> : <Ionicons name="pencil-outline" size={27} color={colors.blue} />}
        <Text style={styles.copy}>{value ? 'Edit cleaned signature' : 'Select and clean signature'}</Text>
      </Pressable>
      <Text style={styles.hint}>Crop the signature, remove shadows, and prepare it on a white background. Maximum 5MB.</Text>
      {!!value && <Pressable onPress={() => onChange(undefined)}><Text style={styles.remove}>Remove signature</Text></Pressable>}

      <Modal visible={!!editorSource} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setEditorSource('')}>
        {!!editorSource && (
          <WebView
            originWhitelist={['*']}
            source={{ html: signatureEditorHtml(editorSource) }}
            onMessage={handleMessage}
            javaScriptEnabled
            style={styles.webview}
          />
        )}
      </Modal>
    </View>
  );
}

const signatureEditorHtml = (source: string) => `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;padding:18px;font-family:system-ui,sans-serif;background:#fff;color:#10243e}
h2{margin:0 0 6px;font-size:22px}.help{margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.45}
.canvas-wrap{border:1px solid #d8e5ff;border-radius:14px;background:#f8fafc;padding:10px;overflow:hidden}
canvas{display:block;width:100%;height:auto;background:#fff;touch-action:none}
label{display:block;font-weight:800;margin:18px 0 8px}input{width:100%}
.actions{display:flex;gap:10px;margin-top:22px}.btn{flex:1;border:0;border-radius:12px;padding:14px;font-weight:800;font-size:15px}
.cancel{background:#e2e8f0;color:#10243e}.save{background:#237bff;color:#fff}
</style></head><body>
<h2>Crop Digital Signature</h2><p class="help">The image starts edge-to-edge. Drag or zoom to adjust it before cleaning.</p>
<div class="canvas-wrap"><canvas id="canvas" width="720" height="250"></canvas></div>
<label for="zoom">Fit signature size</label><input id="zoom" type="range" min="0.5" max="3" step="0.05" value="1">
<div class="actions"><button class="btn cancel" onclick="send('cancel')">Cancel</button><button class="btn save" onclick="save()">Use Signature</button></div>
<script>
const source=${JSON.stringify(source)},canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),img=new Image();
const crop={scale:1,x:0,y:0,drag:false,lastX:0,lastY:0};
function draw(target=ctx,w=canvas.width,h=canvas.height){target.clearRect(0,0,w,h);target.fillStyle='#fff';target.fillRect(0,0,w,h);const fit=Math.max(w/img.width,h/img.height),dw=img.width*fit*crop.scale,dh=img.height*fit*crop.scale;target.drawImage(img,(w-dw)/2+crop.x,(h-dh)/2+crop.y,dw,dh)}
img.onload=()=>draw();img.src=source;
document.getElementById('zoom').oninput=e=>{crop.scale=Number(e.target.value)||1;draw()};
canvas.onpointerdown=e=>{crop.drag=true;crop.lastX=e.clientX;crop.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!crop.drag)return;const r=canvas.getBoundingClientRect();crop.x+=(e.clientX-crop.lastX)*(canvas.width/r.width);crop.y+=(e.clientY-crop.lastY)*(canvas.height/r.height);crop.lastX=e.clientX;crop.lastY=e.clientY;draw()};
canvas.onpointerup=()=>crop.drag=false;canvas.onpointercancel=()=>crop.drag=false;
function clean(src){const w=src.width,h=src.height,out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.drawImage(src,0,0);const im=c.getImageData(0,0,w,h),d=im.data,g=new Uint8Array(w*h),ii=new Uint32Array(w*h);for(let i=0;i<d.length;i+=4)g[i/4]=d[i]*.299+d[i+1]*.587+d[i+2]*.114;for(let y=0;y<h;y++){let sum=0;for(let x=0;x<w;x++){sum+=g[y*w+x];ii[y*w+x]=sum+(y?ii[(y-1)*w+x]:0)}}for(let y=0;y<h;y++)for(let x=0;x<w;x++){const x1=Math.max(x-25,0),x2=Math.min(x+25,w-1),y1=Math.max(y-25,0),y2=Math.min(y+25,h-1),count=(x2-x1+1)*(y2-y1+1);let sum=ii[y2*w+x2];if(y1)sum-=ii[(y1-1)*w+x2];if(x1)sum-=ii[y2*w+x1-1];if(x1&&y1)sum+=ii[(y1-1)*w+x1-1];const p=y*w+x,ink=g[p]<(sum/count)*.92&&g[p]<220,v=ink?0:255;d[p*4]=v;d[p*4+1]=v;d[p*4+2]=v;d[p*4+3]=255}c.putImageData(im,0,0);return out}
function send(type,dataUrl){window.ReactNativeWebView.postMessage(JSON.stringify({type,dataUrl}))}
function save(){const out=document.createElement('canvas');out.width=720;out.height=250;draw(out.getContext('2d',{willReadFrequently:true}),720,250);send('save',clean(out).toDataURL('image/png'))}
</script></body></html>`;

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, gap: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  picker: { minHeight: 92, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A9C9F5', borderRadius: radii.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10 },
  preview: { width: '100%', height: 70, backgroundColor: '#fff' },
  copy: { color: colors.blueDeep, fontSize: 12, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  remove: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  webview: { flex: 1, backgroundColor: '#fff' },
});
