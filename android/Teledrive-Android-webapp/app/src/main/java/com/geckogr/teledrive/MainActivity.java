package com.geckogr.teledrive;


import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;





public class MainActivity extends AppCompatActivity {


    private WebView webV;
    Activity activity;
    private ProgressDialog progDailog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);



        activity = this;

        progDailog = ProgressDialog.show(activity, "Loading", "Please wait...", true);
        progDailog.setCancelable(false);

        webV = (WebView) findViewById(R.id.webview);

        webV.getSettings().setDomStorageEnabled(true);
        webV.getSettings().setJavaScriptEnabled(true);
        webV.getSettings().setLoadWithOverviewMode(true);
        webV.getSettings().setUseWideViewPort(true);
        webV.setWebChromeClient(new WebChromeClient());
        webV.setWebViewClient(new WebViewClient() {



            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                progDailog.show();
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, final String url) {
                progDailog.dismiss();
            }
        });
        webV.loadUrl("https://androidteledrive.herokuapp.com/");
    }


}




