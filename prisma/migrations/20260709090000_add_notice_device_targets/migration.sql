CREATE TABLE "NoticeDeviceTarget" (
    "noticeId" TEXT NOT NULL,
    "displayDeviceId" TEXT NOT NULL,

    CONSTRAINT "NoticeDeviceTarget_pkey" PRIMARY KEY ("noticeId","displayDeviceId")
);

CREATE INDEX "NoticeDeviceTarget_displayDeviceId_idx" ON "NoticeDeviceTarget"("displayDeviceId");

ALTER TABLE "NoticeDeviceTarget" ADD CONSTRAINT "NoticeDeviceTarget_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NoticeDeviceTarget" ADD CONSTRAINT "NoticeDeviceTarget_displayDeviceId_fkey" FOREIGN KEY ("displayDeviceId") REFERENCES "DisplayDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
