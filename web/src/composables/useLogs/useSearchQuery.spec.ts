// Copyright 2023 OpenObserve Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { searchState } from "./searchState";
import { useSearchQuery } from "./useSearchQuery";
import store from "@/test/unit/helpers/store";

// Mock vue-router
vi.mock("vue-router", () => ({
  useRouter: () => ({
    currentRoute: {
      value: {
        query: {},
        name: "logs",
      },
    },
    push: vi.fn(),
  }),
}));

// Mock vuex store
vi.mock("vuex", () => ({
  useStore: () => store,
}));

// Wrapper component for the composable
const TestComponent = defineComponent({
  setup() {
    return {
      ...useSearchQuery(),
    };
  },
  template: "<div></div>",
});

describe("useSearchQuery", () => {
  let wrapper: any;
  const { searchObj, resetSearchObj } = searchState();

  beforeEach(() => {
    resetSearchObj();
    wrapper = mount(TestComponent, {
      global: {
        plugins: [store],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const setupBaseSearch = () => {
    searchObj.meta.sqlMode = false;
    searchObj.meta.quickMode = true;
    searchObj.data.query = "some query";
    searchObj.data.stream.selectedStream = ["default"];
    searchObj.data.stream.streamLists = [
      { name: "default", storage_type: "disk" },
    ] as any;
  };

  const setupField = (name: string) => ({
    name,
    type: "Utf8",
    streams: ["default"],
  });

  describe("buildSearch", () => {
    it("quotes interesting fields when Quick Mode is active", () => {
      setupBaseSearch();
      searchObj.data.stream.interestingFieldList = ["user", "role"];
      searchObj.data.stream.selectedStreamFields = [
        setupField("user"),
        setupField("role"),
      ];

      const result = wrapper.vm.buildSearch();

      expect(result).not.toBeNull();
      expect(result.query.sql).toContain('select "user","role"');
    });

    it("quotes filter field in final SQL when SQL mode is disabled", () => {
      setupBaseSearch();
      searchObj.meta.quickMode = false;
      searchObj.data.query = "user='asdf'";
      searchObj.data.stream.selectedStreamFields = [setupField("user")];

      const result = wrapper.vm.buildSearch();

      expect(result).not.toBeNull();
      expect(result.query.sql).toContain('WHERE "user" = \'asdf\'');
    });
  });
});
