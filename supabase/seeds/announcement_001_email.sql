-- Re-send the email-consent announcement (the previous attempt got mojibake'd
-- because the shell mangled UTF-8 on Windows). Reading from a file via -f
-- preserves UTF-8 bytes intact.
INSERT INTO announcements (title, body, link_url, link_label, created_by)
VALUES (
  '【ご確認ください】メールアドレスのお取り扱いについて',
  E'楽市楽座をいち早くご登録いただきありがとうございます。\n\n運営から、個人情報のお取り扱いについて1点ご確認させてください。\n\nGoogleでログインに使われたあなたのメールアドレスを、他のむらびとから「連絡を取る」ための手段として、名刺の連絡画面に表示してもよろしいでしょうか？\n\n・「了承する」場合：他のむらびとがメールであなたに直接連絡できるようになります\n・「同意しない」場合：Googleのメールは表示されません（楽市楽座の手紙・LINE QR・Instagram DMなどは利用可能）\n\n「同意しない」を選んだ方も、設定→プロフィールから「別のメールアドレス」を任意に登録できます。Googleのメールを公開したくない方はそちらをご利用ください。\n\n下のボタンから設定をお願いします（あとからいつでも変更できます）。',
  '/settings/profile',
  '⚙ 設定する',
  '68fe7114-a6a3-43f5-abd7-001ccf3b4859'
);
