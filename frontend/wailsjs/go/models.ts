export namespace models {
	
	export class CreateProjectRequest {
	    name: string;
	    description?: string;
	    url?: string;
	    discord?: string;
	    directory?: string;
	    deadline?: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new CreateProjectRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.url = source["url"];
	        this.discord = source["discord"];
	        this.directory = source["directory"];
	        this.deadline = this.convertValues(source["deadline"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateTimeBlockRequest {
	    project_id: number;
	    start_time: time.Time;
	    end_time?: time.Time;
	    duration: number;
	    is_manual: boolean;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateTimeBlockRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.project_id = source["project_id"];
	        this.start_time = this.convertValues(source["start_time"], time.Time);
	        this.end_time = this.convertValues(source["end_time"], time.Time);
	        this.duration = source["duration"];
	        this.is_manual = source["is_manual"];
	        this.description = source["description"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Project {
	    id: number;
	    name: string;
	    description?: string;
	    url?: string;
	    discord?: string;
	    directory?: string;
	    deadline?: time.Time;
	    status: string;
	    created_at: time.Time;
	    updated_at: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.url = source["url"];
	        this.discord = source["discord"];
	        this.directory = source["directory"];
	        this.deadline = this.convertValues(source["deadline"], time.Time);
	        this.status = source["status"];
	        this.created_at = this.convertValues(source["created_at"], time.Time);
	        this.updated_at = this.convertValues(source["updated_at"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Settings {
	    id: number;
	    theme: string;
	    language: string;
	    timeFormat: string;
	    customUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.theme = source["theme"];
	        this.language = source["language"];
	        this.timeFormat = source["timeFormat"];
	        this.customUrl = source["customUrl"];
	    }
	}
	export class TimeBlock {
	    id: number;
	    project_id: number;
	    project_name: string;
	    start_time: time.Time;
	    end_time?: time.Time;
	    duration: number;
	    is_manual: boolean;
	    description?: string;
	    created_at: time.Time;
	    updated_at: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new TimeBlock(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.project_id = source["project_id"];
	        this.project_name = source["project_name"];
	        this.start_time = this.convertValues(source["start_time"], time.Time);
	        this.end_time = this.convertValues(source["end_time"], time.Time);
	        this.duration = source["duration"];
	        this.is_manual = source["is_manual"];
	        this.description = source["description"];
	        this.created_at = this.convertValues(source["created_at"], time.Time);
	        this.updated_at = this.convertValues(source["updated_at"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateProjectRequest {
	    name?: string;
	    description?: string;
	    url?: string;
	    discord?: string;
	    directory?: string;
	    deadline?: time.Time;
	    status?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateProjectRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.url = source["url"];
	        this.discord = source["discord"];
	        this.directory = source["directory"];
	        this.deadline = this.convertValues(source["deadline"], time.Time);
	        this.status = source["status"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateSettingsRequest {
	    theme?: string;
	    language?: string;
	    timeFormat?: string;
	    customUrl?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateSettingsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.language = source["language"];
	        this.timeFormat = source["timeFormat"];
	        this.customUrl = source["customUrl"];
	    }
	}
	export class UpdateTimeBlockRequest {
	    start_time?: time.Time;
	    end_time?: time.Time;
	    duration?: number;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateTimeBlockRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.start_time = this.convertValues(source["start_time"], time.Time);
	        this.end_time = this.convertValues(source["end_time"], time.Time);
	        this.duration = source["duration"];
	        this.description = source["description"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

