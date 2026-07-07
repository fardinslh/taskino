import { describe, expect, it } from "vitest";

import { notificationTarget, notificationText } from "./task-helpers";

describe("notification text localization", () => {
  it("localizes fixed task rating notifications", () => {
    const localized = notificationText({
      _id: "notification-1",
      title: "Fixed Task Rated",
      message: "Manager added a rating of ۴ for the fixed task تست ۴",
    });

    expect(localized).toEqual({
      title: "گزارش ثابت امتیازدهی شد",
      message: "مدیر برای گزارش ثابت «تست ۴» امتیاز ۴ ثبت کرد.",
    });
  });

  it("finds a fixed task target from a notification link", () => {
    expect(
      notificationTarget({
        _id: "notification-2",
        title: "Fixed Task Rated",
        message: "Manager added a rating of ۴ for the fixed task تست ۴",
        link: "/fixed-tasks/fixed-task-1",
      }),
    ).toEqual({
      kind: "fixedTask",
      id: "fixed-task-1",
      title: "تست ۴",
    });
  });

  it("falls back to the completed task title when no id exists", () => {
    expect(
      notificationTarget({
        _id: "notification-3",
        title: "Task Completed",
        message: "تست پروژه has been completed by an assigned user.",
      }),
    ).toEqual({
      kind: "task",
      id: undefined,
      title: "تست پروژه",
    });
  });

  it("localizes generic assigned-user completion text", () => {
    const localized = notificationText({
      _id: "notification-4",
      title: "Task Completed",
      message: "تست پروژه has been completed by an assigned user.",
    });

    expect(localized).toEqual({
      title: "گزارش تکمیل شد",
      message: "گزارش «تست پروژه» توسط یک کاربر مسئول تکمیل شد.",
    });
  });

  it("does not expose unknown English notification templates", () => {
    const localized = notificationText({
      _id: "notification-5",
      title: "Unknown Backend Title",
      message: "This backend message is not mapped yet.",
    });

    expect(localized).toEqual({
      title: "اعلان جدید",
      message: "برای مشاهده جزئیات این اعلان را باز کنید.",
    });
  });

  it("localizes leave request notifications", () => {
    expect(
      notificationText({
        _id: "notification-6",
        title: "Leave Request Submitted",
        message: "پوریا باری زاده submitted a leave request.",
      }),
    ).toEqual({
      title: "درخواست مرخصی جدید",
      message: "پوریا باری زاده درخواست مرخصی ثبت کرد.",
    });
  });

  it("localizes extra task decision notifications", () => {
    expect(
      notificationText({
        _id: "notification-7",
        title: "Extra Task Approved",
        message: "Your extra task تست پروژه has been approved.",
      }),
    ).toEqual({
      title: "پروژه مازاد تأیید شد",
      message: "پروژه مازاد «تست پروژه» تأیید شد.",
    });
  });
});
