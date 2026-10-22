package id.nadi.prototipe;

import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Menerima paket CSI dari ESP32 lewat UDP (alat mengirim ke alamat gateway = HP ini sebagai hotspot).
 * Paket dikumpulkan lalu dikirim ke JS per 100 ms sebagai event "packets" (base64), supaya jembatan
 * WebView tidak dipanggil 50x per detik.
 */
@CapacitorPlugin(name = "UdpReceiver")
public class UdpReceiverPlugin extends Plugin {

    private static final int FLUSH_MS = 100;

    private DatagramSocket socket;
    private Thread thread;
    private final List<String> pending = new ArrayList<>();
    private String lastFrom = null;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private final Runnable flush = new Runnable() {
        @Override
        public void run() {
            JSArray batch = new JSArray();
            String from;
            synchronized (pending) {
                for (String p : pending) batch.put(p);
                pending.clear();
                from = lastFrom;
            }
            if (batch.length() > 0) {
                JSObject data = new JSObject();
                data.put("packets", batch);
                data.put("from", from);
                notifyListeners("packets", data);
            }
            if (socket != null) handler.postDelayed(this, FLUSH_MS);
        }
    };

    @PluginMethod
    public void start(PluginCall call) {
        int port = call.getInt("port", 5005);
        stopSocket();
        try {
            DatagramSocket s = new DatagramSocket(null);
            s.setReuseAddress(true);
            s.bind(new InetSocketAddress(port));
            socket = s;
        } catch (Exception e) {
            call.reject("Port UDP " + port + " tidak bisa dibuka: " + e.getMessage());
            return;
        }
        final DatagramSocket s = socket;
        thread = new Thread(() -> {
            byte[] buf = new byte[1500];
            while (!s.isClosed()) {
                try {
                    DatagramPacket p = new DatagramPacket(buf, buf.length);
                    s.receive(p);
                    String b64 = Base64.encodeToString(Arrays.copyOf(p.getData(), p.getLength()), Base64.NO_WRAP);
                    synchronized (pending) {
                        pending.add(b64);
                        lastFrom = p.getAddress().getHostAddress();
                    }
                } catch (Exception e) {
                    // socket ditutup (stop) -> keluar dari loop
                }
            }
        }, "nadi-udp");
        thread.start();
        handler.postDelayed(flush, FLUSH_MS);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopSocket();
        call.resolve();
    }

    private void stopSocket() {
        handler.removeCallbacks(flush);
        if (socket != null) {
            socket.close();
            socket = null;
        }
        thread = null;
        synchronized (pending) {
            pending.clear();
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopSocket();
    }
}
