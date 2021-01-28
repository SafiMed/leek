import {TaskFilters, getTimeFilterQuery} from "./task";
import {search} from "./search";

export interface Issue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TaskFilters,
    ): any;
}

export class IssueService implements Issue {
    filter(
        app_name: string,
        app_env: string | undefined,
        filters: TaskFilters,
    ) {
        return search(
            app_name,
            {
                query: {
                    "bool": {
                        "must": [getTimeFilterQuery(filters)].filter(Boolean)
                    }
                },
                aggs: {
                    exceptions: {
                        terms: {field: "exception.keyword"},
                        aggs: {
                            state: {
                                terms: {field: "state"}
                            },
                        }
                    },
                }
            },
            {
                size: 0,
                from_: 0
            }
        )
    }
}