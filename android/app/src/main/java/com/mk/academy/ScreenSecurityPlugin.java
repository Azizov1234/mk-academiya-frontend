package com.mk.academy;

import android.app.Activity;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenSecurity")
public class ScreenSecurityPlugin extends Plugin {
    @PluginMethod
    public void enableSecure(PluginCall call) {
        withActivity(call, activity -> {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            call.resolve(new JSObject());
        });
    }

    @PluginMethod
    public void disableSecure(PluginCall call) {
        withActivity(call, activity -> {
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            call.resolve(new JSObject());
        });
    }

    private void withActivity(PluginCall call, ActivityAction action) {
        Activity activity = getActivity();

        if (activity == null) {
          call.reject("Main activity is not available.");
          return;
        }

        activity.runOnUiThread(() -> action.run(activity));
    }

    private interface ActivityAction {
        void run(Activity activity);
    }
}
