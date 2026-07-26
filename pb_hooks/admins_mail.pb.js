/// <reference path="../pb_data/types.d.ts" />

/**
 * Custom HTML for admin auth system emails (password reset / verification).
 * Helpers must be require()'d inside each handler (PB handler isolation).
 */

onMailerRecordPasswordResetSend((e) => {
  const mail = require(`${__hooks}/sk_mail.js`);
  const record = e.record;
  const email = record.email();
  const name = String(record.get("name") || "");
  const link = mail.extractActionURL(e.message);

  e.message.subject = `${mail.SITE_TITLE}: reset your admin password`;
  e.message.html = mail.renderEmail("admin-password-reset", {
    name,
    email,
    actionURL: link,
  });
  e.message.text = mail.plainTextFromData(e.message.subject, {
    name,
    email,
    actionURL: link,
  });

  e.next();
}, "admins");

onMailerRecordVerificationSend((e) => {
  const mail = require(`${__hooks}/sk_mail.js`);
  const record = e.record;
  const email = record.email();
  const name = String(record.get("name") || "");
  const link = mail.extractActionURL(e.message);

  e.message.subject = `${mail.SITE_TITLE}: verify your admin email`;
  e.message.html = mail.renderEmail("admin-verification", {
    name,
    email,
    actionURL: link,
  });
  e.message.text = mail.plainTextFromData(e.message.subject, {
    name,
    email,
    actionURL: link,
  });

  e.next();
}, "admins");
